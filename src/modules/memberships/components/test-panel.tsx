import { getFormatter } from "next-intl/server";

import { TEST_PASSWORD, testModeEnabled } from "../server/test-mode";
import { getViewer } from "../server/viewer";
import type { MembershipPreset } from "../test-presets";
import { TestPanelMenu } from "./test-panel-menu";

const DAY = 24 * 60 * 60 * 1000;

// Floating switcher for trying the app as a guest, a free account, a member or the
// instructor. Only rendered while payments are mocked.
export async function TestPanel() {
  if (!(await testModeEnabled())) return null;
  const [viewer, format] = await Promise.all([getViewer(), getFormatter()]);
  const m = viewer.membership;

  // Which preset the current membership looks like, so the menu can mark it.
  let preset: MembershipPreset = "none";
  if (m?.status === "trialing") preset = "trial";
  else if (m?.status === "past_due") preset = "pastDue";
  else if (m && m.currentPeriodEnd.getTime() <= Date.now()) preset = "expired";
  else if (m?.status === "active") preset = m.cancelAtPeriodEnd ? "canceling" : "active";
  else if (m) preset = "expired";

  return (
    <TestPanelMenu
      user={viewer.user ? { name: viewer.user.name, email: viewer.user.email, role: viewer.user.role } : null}
      hasAccess={viewer.hasAccess}
      preset={preset}
      periodEnd={m ? format.dateTime(m.currentPeriodEnd, { dateStyle: "medium" }) : null}
      daysLeft={m ? Math.ceil((m.currentPeriodEnd.getTime() - Date.now()) / DAY) : null}
      password={TEST_PASSWORD}
      canSimulate={m?.provider === "mock" && !!m.providerSubscriptionId?.startsWith("mock_sub_")}
    />
  );
}
