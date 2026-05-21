import { type Agent } from "@/lib/agents";

export interface AgentGroup {
  key: string;
  label: string;
  isStaff: boolean;
  activeAgents: Agent[];
  inactiveAgents: Agent[];
}

/**
 * Group agents into three buckets from the current user's perspective:
 * - "Personas publics" : personas marked is_public=true (visible by everyone)
 * - "Mes personas" : personas created by the current user
 * - One group per other user (admin/teacher view only)
 */
export function groupAgentsByCreator(
  agents: Agent[],
  currentUserId?: string | null
): AgentGroup[] {
  const publicAgents: Agent[] = [];
  const myAgents: Agent[] = [];
  const othersMap = new Map<string, { name: string; agents: Agent[] }>();

  for (const agent of agents) {
    if (agent.is_public) {
      publicAgents.push(agent);
    } else if (currentUserId && agent.created_by === currentUserId) {
      myAgents.push(agent);
    } else {
      const creatorId = agent.created_by ?? "unknown";
      const creatorName = agent.creator_name ?? "Inconnu";
      if (!othersMap.has(creatorId)) {
        othersMap.set(creatorId, { name: creatorName, agents: [] });
      }
      othersMap.get(creatorId)!.agents.push(agent);
    }
  }

  const groups: AgentGroup[] = [];

  if (publicAgents.length > 0) {
    groups.push({
      key: "public",
      label: "Personas publics",
      isStaff: true,
      activeAgents: publicAgents.filter((a) => a.active),
      inactiveAgents: publicAgents.filter((a) => !a.active),
    });
  }

  if (myAgents.length > 0) {
    groups.push({
      key: "mine",
      label: "Mes personas",
      isStaff: false,
      activeAgents: myAgents.filter((a) => a.active),
      inactiveAgents: myAgents.filter((a) => !a.active),
    });
  }

  const otherEntries = Array.from(othersMap.entries()).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, "fr")
  );

  for (const [creatorId, { name, agents: otherAgents }] of otherEntries) {
    groups.push({
      key: creatorId,
      label: name,
      isStaff: false,
      activeAgents: otherAgents.filter((a) => a.active),
      inactiveAgents: otherAgents.filter((a) => !a.active),
    });
  }

  return groups;
}
