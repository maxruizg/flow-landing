import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { render } from "@react-email/render";
import { requireAdmin } from "~/lib/session.server";
import { NewCollectionEmail } from "~/emails/new-collection";
import { FlashSaleEmail } from "~/emails/flash-sale";
import { ProductLaunchEmail } from "~/emails/product-launch";

const templateMap: Record<string, React.FC<any>> = {
  "new-collection": NewCollectionEmail,
  "flash-sale": FlashSaleEmail,
  "product-launch": ProductLaunchEmail,
};

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { componentName, variables } = await request.json();

    if (!componentName || typeof componentName !== "string") {
      return json({ error: "componentName is required" }, { status: 400 });
    }

    const Component = templateMap[componentName];
    if (!Component) {
      return json(
        { error: `Unknown template: ${componentName}. Available: ${Object.keys(templateMap).join(", ")}` },
        { status: 400 },
      );
    }

    const html = await render(<Component {...(variables || {})} />);

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("[email-preview] Render error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Failed to render email preview" },
      { status: 500 },
    );
  }
}
