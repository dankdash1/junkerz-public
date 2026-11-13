import React, { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import QuotePage from "../src/app/quote/page";
import HeroQuoteForm, { ES } from "../src/components/HeroQuoteForm";
import TrimPicker from "../src/components/TrimPicker";
import { getTrimOptions } from "../src/lib/vehicle-trims";

const { push, submit, navigation } = vi.hoisted(() => ({
  push: vi.fn(), submit: vi.fn(), navigation: { query: "" },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("../src/lib/api", () => ({ submitQuote: submit }));
vi.mock("../src/components/Analytics", () => ({ trackLeadSubmission: vi.fn() }));

beforeEach(() => {
  navigation.query = "";
  push.mockReset();
  submit.mockReset().mockResolvedValue({ offer_id: 42, status: "quoted" });
  vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
    json: async () => url.includes("/years") ? { years: [2023, 2014] }
      : url.includes("/makes/") ? { makes: [{ id: 1, name: "Dodge" }] }
      : { models: [{ id: 10, name: "Challenger" }, { id: 11, name: "Charger" }] },
  })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function chooseCar() {
  await screen.findByRole("option", { name: "2023" });
  fireEvent.change(screen.getByRole("combobox", { name: "Vehicle year" }), { target: { value: "2023" } });
  await screen.findByRole("option", { name: "Dodge" });
  fireEvent.change(screen.getByRole("combobox", { name: "Vehicle make" }), { target: { value: "1" } });
  await screen.findByRole("option", { name: "Challenger" });
  fireEvent.change(screen.getByRole("combobox", { name: "Vehicle model" }), { target: { value: "10" } });
}

function next() { fireEvent.click(screen.getByRole("button", { name: "Continue" })); }

describe("simple seller quote", () => {
  it.each(["", "SRT Hellcat", "Custom / 6.2L V8"])("gets a quote without VIN, plate, mileage or address; optional trim: %s", async (selectedTrim) => {
    render(<QuotePage />);
    await chooseCar();
    if (selectedTrim) {
      fireEvent.change(screen.getByRole("combobox", { name: "Trim / engine (optional)" }), { target: { value: selectedTrim.startsWith("Custom") ? "__other" : selectedTrim } });
      if (selectedTrim.startsWith("Custom")) fireEvent.change(screen.getByLabelText("Your trim or engine"), { target: { value: selectedTrim } });
    }
    expect(screen.queryByLabelText(/^VIN/)).toBeNull();
    expect(screen.queryByLabelText(/License plate/)).toBeNull();
    expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false);
    next();
    fireEvent.click(screen.getByRole("button", { name: "Clean title" })); next();
    screen.getAllByRole("button", { name: "Yes" }).forEach((b) => fireEvent.click(b)); next();
    screen.getAllByRole("button", { name: "intact" }).forEach((b) => fireEvent.click(b));
    screen.getAllByRole("button", { name: "Yes" }).forEach((b) => fireEvent.click(b)); next();
    next(); // Damage is optional.
    fireEvent.change(screen.getByLabelText("Zip code"), { target: { value: "75201" } }); next();

    const offer = () => screen.getByRole("button", { name: "Get my offer" }) as HTMLButtonElement;
    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: "Jane Seller" } });
    fireEvent.change(screen.getByLabelText(/^Phone/), { target: { value: "8175550123" } });
    expect(offer().disabled).toBe(true); // Email remains required.
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "jane@example.com" } });
    expect(offer().disabled).toBe(false);
    for (const [label, value] of [[/Your name/, "Jane Seller"], [/^Phone/, "8175550123"], [/^Email/, "jane@example.com"]] as const) {
      fireEvent.change(screen.getByLabelText(label), { target: { value: "" } });
      expect(offer().disabled).toBe(true);
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    fireEvent.click(offer());
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    const payload = submit.mock.calls[0][0];
    expect(payload).toMatchObject({ contact_name: "Jane Seller", contact_email: "jane@example.com", contact_phone: "8175550123", sms_consent: false });
    expect(payload.trim).toBe(selectedTrim || undefined);
    expect(payload.vin).toBeUndefined();
    expect(payload.license_plate).toBeUndefined();
    expect(payload.weight_lbs).toBeUndefined();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/quote/result?id=42&status=quoted"));
  });

  it("requires all drivability answers and the flat-tire location when applicable", async () => {
    render(<QuotePage />); await chooseCar(); next();
    fireEvent.click(screen.getByRole("button", { name: "Clean title" })); next();
    const enabled = () => !(screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled;
    expect(enabled()).toBe(false);
    for (let index = 0; index < 4; index++) {
      fireEvent.click(screen.getAllByRole("button", { name: "Yes" })[index]);
      expect(enabled()).toBe(index === 3);
    }
    fireEvent.click(screen.getAllByRole("button", { name: "No" })[3]);
    expect(enabled()).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Front" }));
    expect(enabled()).toBe(true);
  });

  it("skips the repeated vehicle card, keeps the homepage trim and clears it on a car change", async () => {
    navigation.query = "year=2023&make_id=1&make=Dodge&model_id=10&model=Challenger&trim=SRT+Hellcat";
    render(<QuotePage />);
    expect(await screen.findByRole("heading", { name: "Do you have the title?" })).toBeTruthy();
    expect(screen.getByText(/2023 Dodge Challenger.*SRT Hellcat/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    const trim = screen.getByRole("combobox", { name: "Trim / engine (optional)" }) as HTMLSelectElement;
    expect(trim.value).toBe("SRT Hellcat");
    await screen.findByRole("option", { name: "Charger" });
    fireEvent.change(screen.getByRole("combobox", { name: "Vehicle model" }), { target: { value: "11" } });
    expect((screen.getByRole("combobox", { name: "Trim / engine (optional)" }) as HTMLSelectElement).value).toBe("");
  });
});

describe("homepage trim handoff", () => {
  it.each(["", "SRT Hellcat"])("carries an optional trim (%s) into the wizard", async (trim) => {
    render(<HeroQuoteForm />);
    await chooseCar();
    if (trim) fireEvent.change(screen.getByRole("combobox", { name: "Trim / engine (optional)" }), { target: { value: trim } });
    fireEvent.click(screen.getByRole("button", { name: "See what it's worth" }));
    const url = new URL(push.mock.calls[0][0], "https://junkerz.com");
    expect(url.searchParams.get("model")).toBe("Challenger");
    expect(url.searchParams.get("trim")).toBe(trim || null);
  });

  it("clears the trim after changing the model", async () => {
    render(<HeroQuoteForm />); await chooseCar();
    const trim = screen.getByRole("combobox", { name: "Trim / engine (optional)" });
    fireEvent.change(trim, { target: { value: "SRT Hellcat" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Vehicle model" }), { target: { value: "11" } });
    expect((screen.getByRole("combobox", { name: "Trim / engine (optional)" }) as HTMLSelectElement).value).toBe("");
  });

  it("labels the optional trim in Spanish and preserves the language", async () => {
    render(<HeroQuoteForm copy={ES} lang="es" />); await chooseCar();
    expect(screen.getByRole("combobox", { name: "Versión / motor (opcional)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ver cuánto vale" }));
    expect(push.mock.calls[0][0]).toContain("lang=es");
  });
});

describe("optional trim choices", () => {
  it("limits performance suggestions to the matching vehicle and years", () => {
    expect(getTrimOptions(2023, "DODGE", "Challenger")).toContain("SRT Hellcat");
    expect(getTrimOptions(2014, "Dodge", "Challenger")).not.toContain("SRT Hellcat");
    expect(getTrimOptions(2024, "Dodge", "Charger")).not.toContain("SRT Hellcat");
    expect(getTrimOptions(2024, "Ford", "Mustang")).toContain("Dark Horse");
    expect(getTrimOptions(2023, "Ford", "Mustang")).not.toContain("Dark Horse");
    expect(getTrimOptions(2024, "Chevrolet", "Camaro")).toContain("ZL1");
    expect(getTrimOptions(2021, "RAM", "1500")).toContain("TRX");
    expect(getTrimOptions(2010, "Toyota", "Camry")).toEqual([]);
  });

  it("accepts a custom trim or engine without making it required", () => {
    function CustomCar() {
      const [value, setValue] = useState("");
      return <TrimPicker year={2010} make="Toyota" model="Camry" value={value} onChange={setValue} />;
    }
    render(<CustomCar />);
    const select = screen.getByRole("combobox", { name: "Trim / engine (optional)" }) as HTMLSelectElement;
    expect(select.required).toBe(false);
    fireEvent.change(select, { target: { value: "__other" } });
    fireEvent.change(screen.getByLabelText("Your trim or engine"), { target: { value: "XLE / 3.5L V6" } });
    expect((screen.getByLabelText("Your trim or engine") as HTMLInputElement).value).toBe("XLE / 3.5L V6");
    fireEvent.change(select, { target: { value: "" } });
    expect(screen.queryByLabelText("Your trim or engine")).toBeNull();
  });
});
