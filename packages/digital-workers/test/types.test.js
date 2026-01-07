/**
 * Type tests for digital-workers
 */
import { describe, it, expect } from 'vitest';
describe('Worker Types', () => {
    describe('Worker interface', () => {
        it('should have required properties', () => {
            const worker = {
                id: 'worker_1',
                name: 'Test Worker',
                type: 'human',
                status: 'available',
                contacts: {},
            };
            expect(worker.id).toBe('worker_1');
            expect(worker.name).toBe('Test Worker');
            expect(worker.type).toBe('human');
            expect(worker.status).toBe('available');
        });
        it('should support human type', () => {
            const human = {
                id: 'human_1',
                name: 'Alice',
                type: 'human',
                status: 'available',
                contacts: {
                    email: 'alice@company.com',
                    slack: { workspace: 'acme', user: 'U123' },
                },
            };
            expect(human.type).toBe('human');
        });
        it('should support agent type', () => {
            const agent = {
                id: 'agent_1',
                name: 'Code Reviewer',
                type: 'agent',
                status: 'available',
                contacts: {
                    api: { endpoint: 'https://api.internal/agent', auth: 'bearer' },
                },
            };
            expect(agent.type).toBe('agent');
        });
        it('should support all worker statuses', () => {
            const statuses = ['available', 'busy', 'away', 'offline'];
            expect(statuses).toHaveLength(4);
        });
    });
    describe('WorkerRef interface', () => {
        it('should be a lightweight reference', () => {
            const ref = { id: 'worker_1' };
            expect(ref.id).toBe('worker_1');
        });
        it('should support optional properties', () => {
            const ref = {
                id: 'worker_1',
                type: 'human',
                name: 'Alice',
                role: 'Engineer',
            };
            expect(ref.type).toBe('human');
            expect(ref.name).toBe('Alice');
            expect(ref.role).toBe('Engineer');
        });
    });
    describe('Team interface', () => {
        it('should group workers', () => {
            const team = {
                id: 'team_1',
                name: 'Engineering',
                members: [{ id: 'alice' }, { id: 'bob' }],
                contacts: { slack: '#engineering' },
            };
            expect(team.members).toHaveLength(2);
            expect(team.contacts.slack).toBe('#engineering');
        });
        it('should support lead and goals', () => {
            const team = {
                id: 'team_1',
                name: 'Engineering',
                members: [{ id: 'alice' }],
                contacts: {},
                lead: { id: 'alice' },
                goals: ['Ship v2.0', 'Reduce tech debt'],
            };
            expect(team.lead?.id).toBe('alice');
            expect(team.goals).toHaveLength(2);
        });
    });
    describe('Contacts interface', () => {
        it('should support string contacts', () => {
            const contacts = {
                email: 'test@example.com',
                slack: '@user',
                phone: '+1-555-1234',
            };
            expect(contacts.email).toBe('test@example.com');
        });
        it('should support object contacts', () => {
            const contacts = {
                email: { address: 'test@example.com', name: 'Test User' },
                slack: { workspace: 'acme', user: 'U123', channel: '#general' },
                phone: { number: '+1-555-1234', country: 'US', verified: true },
            };
            expect(contacts.email.address).toBe('test@example.com');
        });
        it('should support all channel types', () => {
            const channels = [
                'email', 'slack', 'teams', 'discord', 'phone',
                'sms', 'whatsapp', 'telegram', 'web', 'api', 'webhook',
            ];
            expect(channels).toHaveLength(11);
        });
    });
});
describe('Action Types', () => {
    describe('WorkerAction', () => {
        it('should support all action types', () => {
            const actions = ['notify', 'ask', 'approve', 'decide', 'do'];
            expect(actions).toHaveLength(5);
        });
    });
    describe('NotifyActionData', () => {
        it('should have required properties', () => {
            const data = {
                actor: 'system',
                object: { id: 'alice' },
                action: 'notify',
                message: 'Hello',
            };
            expect(data.action).toBe('notify');
            expect(data.message).toBe('Hello');
        });
        it('should support priority and via', () => {
            const data = {
                actor: 'system',
                object: 'alice',
                action: 'notify',
                message: 'Urgent!',
                priority: 'urgent',
                via: 'slack',
            };
            expect(data.priority).toBe('urgent');
            expect(data.via).toBe('slack');
        });
    });
    describe('AskActionData', () => {
        it('should have question property', () => {
            const data = {
                actor: 'system',
                object: { id: 'alice' },
                action: 'ask',
                question: 'What is the status?',
            };
            expect(data.action).toBe('ask');
            expect(data.question).toBe('What is the status?');
        });
        it('should support schema and timeout', () => {
            const data = {
                actor: 'system',
                object: 'alice',
                action: 'ask',
                question: 'Priority?',
                schema: { priority: 'low | normal | high' },
                timeout: 60000,
            };
            expect(data.schema).toBeDefined();
            expect(data.timeout).toBe(60000);
        });
    });
    describe('ApproveActionData', () => {
        it('should have request property', () => {
            const data = {
                actor: { id: 'alice' },
                object: 'expense_123',
                action: 'approve',
                request: 'Expense: $500',
            };
            expect(data.action).toBe('approve');
            expect(data.request).toBe('Expense: $500');
        });
    });
    describe('DecideActionData', () => {
        it('should have options property', () => {
            const data = {
                actor: 'ai',
                object: 'decision',
                action: 'decide',
                options: ['A', 'B', 'C'],
            };
            expect(data.action).toBe('decide');
            expect(data.options).toHaveLength(3);
        });
        it('should support context and criteria', () => {
            const data = {
                actor: 'ai',
                object: 'decision',
                action: 'decide',
                options: ['React', 'Vue'],
                context: 'Choosing a framework',
                criteria: ['DX', 'Performance'],
            };
            expect(data.context).toBe('Choosing a framework');
            expect(data.criteria).toHaveLength(2);
        });
    });
    describe('DoActionData', () => {
        it('should have instruction property', () => {
            const data = {
                actor: { id: 'agent_1' },
                object: 'production',
                action: 'do',
                instruction: 'Deploy v2.0',
            };
            expect(data.action).toBe('do');
            expect(data.instruction).toBe('Deploy v2.0');
        });
        it('should support timeout and maxRetries', () => {
            const data = {
                actor: 'agent_1',
                object: 'production',
                action: 'do',
                instruction: 'Deploy',
                timeout: 300000,
                maxRetries: 3,
            };
            expect(data.timeout).toBe(300000);
            expect(data.maxRetries).toBe(3);
        });
    });
});
describe('Result Types', () => {
    describe('NotifyResult', () => {
        it('should indicate send status', () => {
            const result = {
                sent: true,
                via: ['slack'],
                messageId: 'msg_123',
            };
            expect(result.sent).toBe(true);
            expect(result.via).toContain('slack');
        });
        it('should include delivery details', () => {
            const result = {
                sent: true,
                via: ['slack', 'email'],
                sentAt: new Date(),
                delivery: [
                    { channel: 'slack', status: 'sent' },
                    { channel: 'email', status: 'delivered' },
                ],
            };
            expect(result.delivery).toHaveLength(2);
        });
    });
    describe('AskResult', () => {
        it('should contain answer', () => {
            const result = {
                answer: 'The status is good',
                answeredAt: new Date(),
            };
            expect(result.answer).toBe('The status is good');
        });
        it('should support typed answers', () => {
            const result = {
                answer: { level: 'high' },
                answeredBy: { id: 'alice' },
                answeredAt: new Date(),
                via: 'slack',
            };
            expect(result.answer.level).toBe('high');
        });
    });
    describe('ApprovalResult', () => {
        it('should indicate approval status', () => {
            const result = {
                approved: true,
                approvedBy: { id: 'manager' },
                approvedAt: new Date(),
            };
            expect(result.approved).toBe(true);
        });
        it('should support notes', () => {
            const result = {
                approved: false,
                notes: 'Budget exceeded',
                via: 'email',
            };
            expect(result.approved).toBe(false);
            expect(result.notes).toBe('Budget exceeded');
        });
    });
    describe('DecideResult', () => {
        it('should contain choice and reasoning', () => {
            const result = {
                choice: 'React',
                reasoning: 'Best ecosystem support',
                confidence: 0.85,
            };
            expect(result.choice).toBe('React');
            expect(result.confidence).toBe(0.85);
        });
        it('should support alternatives', () => {
            const result = {
                choice: 'React',
                reasoning: 'Best ecosystem',
                confidence: 0.85,
                alternatives: [
                    { option: 'Vue', score: 75 },
                    { option: 'Svelte', score: 65 },
                ],
            };
            expect(result.alternatives).toHaveLength(2);
        });
    });
    describe('DoResult', () => {
        it('should indicate success and result', () => {
            const result = {
                result: { deployed: true },
                success: true,
                duration: 5000,
            };
            expect(result.success).toBe(true);
            expect(result.result.deployed).toBe(true);
        });
        it('should track steps', () => {
            const result = {
                result: { done: true },
                success: true,
                steps: [
                    { action: 'start', result: {}, timestamp: new Date() },
                    { action: 'complete', result: { done: true }, timestamp: new Date() },
                ],
            };
            expect(result.steps).toHaveLength(2);
        });
    });
});
describe('ActionTarget Type', () => {
    it('should accept Worker', () => {
        const worker = {
            id: 'alice',
            name: 'Alice',
            type: 'human',
            status: 'available',
            contacts: {},
        };
        const target = worker;
        expect(target).toBeDefined();
    });
    it('should accept Team', () => {
        const team = {
            id: 'eng',
            name: 'Engineering',
            members: [],
            contacts: {},
        };
        const target = team;
        expect(target).toBeDefined();
    });
    it('should accept WorkerRef', () => {
        const ref = { id: 'alice' };
        const target = ref;
        expect(target).toBeDefined();
    });
    it('should accept string', () => {
        const target = 'alice';
        expect(target).toBe('alice');
    });
});
