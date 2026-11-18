// Written 2026-11-17 under the market-hours write-only rule; run in the owner's release gate.
// Port of draft #22 onto QuoteWizard. All requests are mocked; no lookup provider is called.
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuotePage from "../src/app/(site)/quote/page";

const { push, submit, navigation } = vi.hoisted(() => ({
  push: vi.fn(), submit: vi.fn(), navigation: { query: "" },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("../src/lib/api", () => ({ submitQuote: submit }));
vi.mock("../src/components/Analytics", () => ({ trackLeadSubmission: vi.fn() }));

const DECODED = { vin: "3VWFE21C04M000004", year: 2004, make: "VOLKSWAGEN", model: "Beetle", trim: "Turbo S" };
let lookupEnabled = false;
let lookupFails = false;
let lookups: unknown[] = [];
let holdLookup: Promise<void> | null = null;   // set to delay the lookup reply (race case)

beforeEach(() => {
  navigation.query = "";
  lookupEnabled = false; lookupFails = false; lookups = []; holdLookup = null;
  push.mockReset();
  submit.mockReset().mockResolvedValue({ offer_id: 42, status: "quoted" });
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes("/vehicle-lookup/config")) {
      return { ok: true, json: async () => ({ enabled: lookupEnabled, plate_available: false }) };
    }
    if (url.includes("/vehicle-lookup")) {
      lookups.push(JSON.parse(String(init?.body)));
      if (holdLookup) await holdLookup;
      return lookupFails
        ? { ok: false, json: async () => ({ status: "not_found" }) }
        : { ok: true, json: async () => ({ status: "ok", vehicle: DECODED, vehicle_lookup_token: "signed-token" }) };
    }
    return {
      ok: true,
      json: async () => url.includes("/years") ? { years: [2023, 2014] }
        : url.includes("/makes/") ? { makes: [{ id: 1, name: "Dodge" }] }
        : { models: [{ id: 10, name: "Challenger" }] },
    };
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const continueButton = () => screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement;

async function chooseCarByHand() {
  await screen.findByRole("option", { name: "2023" });
  fireEvent.change(screen.getByRole("combobox", { name: "Vehicle year" }), { target: { value: "2023" } });
  await screen.findByRole("option", { name: "Dodge" });
  fireEvent.change(screen.getByRole("combobox", { name: "Vehicle make" }), { target: { value: "1" } });
  await screen.findByRole("option", { name: "Challenger" });
  fireEvent.change(screen.getByRole("combobox", { name: "Vehicle model" }), { target: { value: "10" } });
}

function next() { fireEvent.click(continueButton()); }

// Remaining steps exactly as tests/seller-easy-quote.test.tsx walks them; returns the submitted payload.
async function finishAndSubmit() {
  await waitFor(() => expect(continueButton().disabled).toBe(false));
  next();
  fireEvent.click(screen.getByRole("button", { name: "Clean title" })); next();
  screen.getAllByRole("button", { name: "Yes" }).forEach((b) => fireEvent.click(b)); next();
  screen.getAllByRole("button", { name: "intact" }).forEach((b) => fireEvent.click(b));
  screen.getAllByRole("button", { name: "Yes" }).forEach((b) => fireEvent.click(b)); next();
  next(); // Damage is optional.
  fireEvent.change(screen.getByLabelText("Zip code"), { target: { value: "75201" } }); next();
  fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: "Jane Seller" } });
  fireEvent.change(screen.getByLabelText(/^Phone/), { target: { value: "8175550123" } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "jane@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Get my offer" }));
  await waitFor(() => expect(submit).toHaveBeenCalledOnce());
  return submit.mock.calls[0][0];
}

async function lookUpVin() {
  await screen.findByRole("heading", { name: "Find your vehicle faster" });
  fireEvent.change(screen.getByPlaceholderText("17 characters"), { target: { value: DECODED.vin } });
  fireEvent.click(screen.getByRole("button", { name: "Find my vehicle" }));
}

describe("optional vehicle lookup on the quote form", () => {
  it("is hidden while the server flag is off, and the quick no-VIN quote still works", async () => {
    render(<QuotePage />);
    await chooseCarByHand();
    expect(screen.queryByRole("heading", { name: "Find your vehicle faster" })).toBeNull();
    expect(screen.queryByPlaceholderText("17 characters")).toBeNull();
    await waitFor(() => expect(continueButton().disabled).toBe(false));
  });

  it("fills the decoded year, make and model and lets the seller continue", async () => {
    lookupEnabled = true;
    render(<QuotePage />);
    await lookUpVin();
    await screen.findByText("Vehicle found. Confirm the details below.");
    expect(lookups).toEqual([{ vin: DECODED.vin }]);
    expect((screen.getByRole("combobox", { name: "Vehicle year" }) as HTMLSelectElement).value).toBe("2004");
    expect((screen.getByRole("combobox", { name: "Vehicle make" }) as HTMLSelectElement).value).toBe("decoded");
    expect((screen.getByRole("combobox", { name: "Vehicle model" }) as HTMLSelectElement).value).toBe("decoded");
    await waitFor(() => expect(continueButton().disabled).toBe(false));
  });

  it("keeps manual entry available when the lookup finds nothing", async () => {
    lookupEnabled = true; lookupFails = true;
    render(<QuotePage />);
    await lookUpVin();
    await screen.findByText("We couldn’t find your vehicle. Check the details or enter them below.");
    await chooseCarByHand();
    await waitFor(() => expect(continueButton().disabled).toBe(false));
  });

  it("drops the looked-up state when the seller changes the vehicle by hand", async () => {
    lookupEnabled = true;
    render(<QuotePage />);
    await lookUpVin();
    await screen.findByText("Vehicle found. Confirm the details below.");
    fireEvent.change(screen.getByRole("combobox", { name: "Vehicle year" }), { target: { value: "2023" } });
    await waitFor(() => expect(screen.queryByText("Vehicle found. Confirm the details below.")).toBeNull());
    expect((screen.getByRole("combobox", { name: "Vehicle make" }) as HTMLSelectElement).value).not.toBe("decoded");
  });

  it("submits the VIN and the signed token together, with the decoded vehicle unchanged", async () => {
    lookupEnabled = true;
    render(<QuotePage />);
    await lookUpVin();
    await screen.findByText("Vehicle found. Confirm the details below.");
    const payload = await finishAndSubmit();
    expect(payload).toMatchObject({ vin: DECODED.vin, vehicle_lookup_token: "signed-token",
      year: DECODED.year, make: DECODED.make, model: DECODED.model, trim: DECODED.trim });
  });

  it("submits neither VIN nor token after a manual correction", async () => {
    lookupEnabled = true;
    render(<QuotePage />);
    await lookUpVin();
    await screen.findByText("Vehicle found. Confirm the details below.");
    await chooseCarByHand();
    const payload = await finishAndSubmit();
    expect(payload).toMatchObject({ year: 2023, make: "Dodge", model: "Challenger" });
    expect(payload).not.toHaveProperty("vin");
    expect(payload).not.toHaveProperty("vehicle_lookup_token");
  });

  it("a slow lookup that answers after a manual pick does not overwrite it", async () => {
    lookupEnabled = true;
    let release!: () => void;
    holdLookup = new Promise<void>((resolve) => { release = resolve; });
    render(<QuotePage />);
    await lookUpVin();                      // request is now in flight and held
    await chooseCarByHand();                // manual change aborts it (revision bump)
    release();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText("Vehicle found. Confirm the details below.")).toBeNull();
    expect((screen.getByRole("combobox", { name: "Vehicle make" }) as HTMLSelectElement).value).toBe("1");
    const payload = await finishAndSubmit();
    expect(payload).toMatchObject({ make: "Dodge", model: "Challenger" });
    expect(payload).not.toHaveProperty("vehicle_lookup_token");
  });
});
