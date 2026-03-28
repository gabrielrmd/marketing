import type { CampaignType, BudgetEntryType } from "./types";

const VALID_CAMPAIGN_TYPES: CampaignType[] = ["product_launch", "seasonal", "evergreen", "event"];
const VALID_ENTRY_TYPES: BudgetEntryType[] = ["planned", "actual"];

export function validateCampaign(input: {
  title: string;
  campaign_type: CampaignType;
  start_date: string | null;
  end_date: string | null;
}): string[] {
  const errors: string[] = [];

  if (!input.title?.trim()) {
    errors.push("Title is required");
  }

  if (!VALID_CAMPAIGN_TYPES.includes(input.campaign_type)) {
    errors.push("Invalid campaign type");
  }

  if (input.start_date && input.end_date) {
    if (new Date(input.end_date) <= new Date(input.start_date)) {
      errors.push("End date must be after start date");
    }
  }

  return errors;
}

export function validateBudgetEntry(input: {
  description: string;
  amount: number;
  entry_type: BudgetEntryType;
}): string[] {
  const errors: string[] = [];

  if (!input.description?.trim()) {
    errors.push("Description is required");
  }

  if (input.amount <= 0) {
    errors.push("Amount must be greater than zero");
  }

  if (!VALID_ENTRY_TYPES.includes(input.entry_type)) {
    errors.push("Invalid entry type");
  }

  return errors;
}
