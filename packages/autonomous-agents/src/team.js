/**
 * Team - Define and coordinate a team of agents and humans
 *
 * Teams enable collaboration and coordination between multiple agents
 * and human workers working toward shared goals.
 *
 * @packageDocumentation
 */
/**
 * Create a team
 *
 * @example
 * ```ts
 * import { Team, Agent, Role } from 'autonomous-agents'
 *
 * const productTeam = Team({
 *   name: 'Product Development',
 *   description: 'Cross-functional team building product features',
 *   members: [
 *     {
 *       id: 'pm-1',
 *       name: 'Sarah',
 *       type: 'human',
 *       role: Roles.ProductManager,
 *       status: 'active',
 *       availability: 'available',
 *     },
 *     {
 *       id: 'dev-agent-1',
 *       name: 'DevAgent',
 *       type: 'agent',
 *       role: Roles.SoftwareEngineer,
 *       status: 'active',
 *       availability: 'available',
 *     },
 *   ],
 *   goals: [
 *     {
 *       id: 'q1-goal',
 *       description: 'Launch new feature X',
 *       target: '100%',
 *       deadline: new Date('2024-03-31'),
 *       priority: 'high',
 *     },
 *   ],
 *   channels: [
 *     { id: 'team-slack', type: 'slack', config: { channel: '#product-dev' } },
 *   ],
 * })
 *
 * // Add a new member
 * team.addMember({
 *   id: 'designer-1',
 *   name: 'Alex',
 *   type: 'human',
 *   role: Roles.Designer,
 * })
 *
 * // Broadcast to team
 * await team.broadcast('Starting sprint planning!')
 *
 * // Get available members
 * const available = team.getAvailableMembers()
 * ```
 */
export function Team(config) {
    const team = {
        id: generateTeamId(config.name),
        name: config.name,
        description: config.description,
        members: config.members || [],
        goals: config.goals,
        context: config.context,
        channels: config.channels,
    };
    return {
        ...team,
        addMember,
        removeMember,
        getMember,
        getMembers,
        getAvailableMembers,
        getMembersByRole,
        getMembersByType,
        updateMember,
        addGoal,
        updateGoal,
        removeGoal,
        getGoals,
        addChannel,
        removeChannel,
        broadcast,
        sendTo,
        updateContext,
        getContext,
    };
    /**
     * Add a member to the team
     */
    function addMember(member) {
        const existing = team.members.find(m => m.id === member.id);
        if (existing) {
            throw new Error(`Member with id ${member.id} already exists`);
        }
        team.members.push(member);
    }
    /**
     * Remove a member from the team
     */
    function removeMember(memberId) {
        const index = team.members.findIndex(m => m.id === memberId);
        if (index === -1)
            return false;
        team.members.splice(index, 1);
        return true;
    }
    /**
     * Get a specific member
     */
    function getMember(memberId) {
        return team.members.find(m => m.id === memberId);
    }
    /**
     * Get all members
     */
    function getMembers() {
        return [...team.members];
    }
    /**
     * Get available members
     */
    function getAvailableMembers() {
        return team.members.filter(m => m.status === 'active' && m.availability === 'available');
    }
    /**
     * Get members by role
     */
    function getMembersByRole(roleId) {
        return team.members.filter(m => m.role.id === roleId);
    }
    /**
     * Get members by type
     */
    function getMembersByType(type) {
        return team.members.filter(m => m.type === type);
    }
    /**
     * Update a member
     */
    function updateMember(memberId, updates) {
        const member = team.members.find(m => m.id === memberId);
        if (!member) {
            throw new Error(`Member with id ${memberId} not found`);
        }
        Object.assign(member, updates);
    }
    /**
     * Add a goal
     */
    function addGoal(goal) {
        if (!team.goals) {
            team.goals = [];
        }
        team.goals.push(goal);
    }
    /**
     * Update a goal
     */
    function updateGoal(goalId, updates) {
        const goal = team.goals?.find(g => g.id === goalId);
        if (!goal) {
            throw new Error(`Goal with id ${goalId} not found`);
        }
        Object.assign(goal, updates);
    }
    /**
     * Remove a goal
     */
    function removeGoal(goalId) {
        if (!team.goals)
            return false;
        const index = team.goals.findIndex(g => g.id === goalId);
        if (index === -1)
            return false;
        team.goals.splice(index, 1);
        return true;
    }
    /**
     * Get all goals
     */
    function getGoals() {
        return team.goals ? [...team.goals] : [];
    }
    /**
     * Add a communication channel
     */
    function addChannel(channel) {
        if (!team.channels) {
            team.channels = [];
        }
        team.channels.push(channel);
    }
    /**
     * Remove a communication channel
     */
    function removeChannel(channelId) {
        if (!team.channels)
            return false;
        const index = team.channels.findIndex(c => c.id === channelId);
        if (index === -1)
            return false;
        team.channels.splice(index, 1);
        return true;
    }
    /**
     * Broadcast message to all team members
     */
    async function broadcast(message, channelType) {
        const channels = channelType
            ? team.channels?.filter(c => c.type === channelType)
            : team.channels;
        if (!channels || channels.length === 0) {
            console.log(`[Team: ${team.name}] Broadcast: ${message}`);
            return;
        }
        // In a real implementation, this would send via the specified channels
        for (const channel of channels) {
            console.log(`[Team: ${team.name}] [${channel.type}:${channel.id}] ${message}`);
        }
    }
    /**
     * Send message to specific team members
     */
    async function sendTo(memberIds, message, channelType) {
        const members = team.members.filter(m => memberIds.includes(m.id));
        if (members.length === 0) {
            throw new Error('No valid members found');
        }
        // In a real implementation, this would send via appropriate channels
        for (const member of members) {
            console.log(`[Team: ${team.name}] To ${member.name}: ${message}`);
        }
    }
    /**
     * Update team context
     */
    function updateContext(key, value) {
        if (!team.context) {
            team.context = {};
        }
        team.context[key] = value;
    }
    /**
     * Get team context
     */
    function getContext(key) {
        if (!team.context)
            return (key ? undefined : {});
        if (key)
            return team.context[key];
        return { ...team.context };
    }
}
/**
 * Generate a team ID from name
 */
function generateTeamId(name) {
    return `team-${name.toLowerCase().replace(/\s+/g, '-')}`;
}
/**
 * Create a team member entry
 */
export function createTeamMember(config) {
    return {
        id: config.id,
        name: config.name,
        type: config.type,
        role: config.role,
        status: config.status || 'active',
        availability: config.availability || 'available',
    };
}
/**
 * Create a team member from an agent
 */
export function teamMemberFromAgent(agent) {
    return {
        id: agent.config.name,
        name: agent.config.name,
        type: 'agent',
        role: agent.config.role,
        status: agent.status === 'idle' || agent.status === 'completed' ? 'active' : 'active',
        availability: agent.status === 'idle' ? 'available' : 'busy',
    };
}
/**
 * Calculate team capacity based on available members
 */
export function calculateTeamCapacity(team) {
    const members = team.getMembers();
    const available = members.filter(m => m.availability === 'available').length;
    const busy = members.filter(m => m.availability === 'busy').length;
    const offline = members.filter(m => m.availability === 'offline').length;
    return {
        total: members.length,
        available,
        busy,
        offline,
    };
}
/**
 * Get team skills - aggregated from all members
 */
export function getTeamSkills(team) {
    const skills = new Set();
    team.getMembers().forEach(member => {
        member.role.skills.forEach(skill => skills.add(skill));
    });
    return Array.from(skills);
}
/**
 * Check if team has a specific skill
 */
export function teamHasSkill(team, skill) {
    return team.getMembers().some(member => member.role.skills.some(s => s.toLowerCase() === skill.toLowerCase() ||
        s.toLowerCase().includes(skill.toLowerCase())));
}
/**
 * Find best member for a task based on role skills
 */
export function findBestMemberForTask(team, requiredSkills) {
    const availableMembers = team.getAvailableMembers();
    if (availableMembers.length === 0)
        return null;
    // Score each member based on skill matches
    const scored = availableMembers.map(member => {
        const matchingSkills = requiredSkills.filter(skill => member.role.skills.some(s => s.toLowerCase().includes(skill.toLowerCase())));
        return {
            member,
            score: matchingSkills.length,
        };
    });
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    return scored.length > 0 && scored[0].score > 0 ? scored[0].member : null;
}
