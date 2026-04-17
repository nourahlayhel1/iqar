import { RequestForm } from "@/components/request-form";

export const dynamic = "force-dynamic";

export default function NewRequestPage() {
  return <RequestForm mode="create" />;
}
