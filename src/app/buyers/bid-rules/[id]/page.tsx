"use client";
// Edit one bid rule. The form lives in BidRuleForm, shared with the new-rule page
// (2026-11-09 rebuild). An older rule (one year range + a list of makes) opens as
// one make card per make with that year range, so it keeps taking the same cars.
import { useParams } from "next/navigation";
import BidRuleForm from "@/components/buyers/BidRuleForm";

export default function EditBidRule() {
  const params = useParams();
  return <BidRuleForm ruleId={Number(params.id)} />;
}
