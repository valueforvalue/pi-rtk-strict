export interface MetricRecord {
	timestamp: string;
	tool: string;
	technique: string;
	originalChars: number;
	filteredChars: number;
	savingsPercent: number;
}

const sessionMetrics: MetricRecord[] = [];

export function trackSavings(
	original: string,
	filtered: string,
	tool: string,
	technique: string
): MetricRecord {
	const originalChars = original.length;
	const filteredChars = filtered.length;
	const savingsPercent =
		originalChars > 0
			? Math.round(((originalChars - filteredChars) / originalChars) * 100 * 100) / 100
			: 0;

	const record: MetricRecord = {
		timestamp: new Date().toISOString(),
		tool,
		technique,
		originalChars,
		filteredChars,
		savingsPercent,
	};

	sessionMetrics.push(record);
	return record;
}

export function getSessionMetrics(): MetricRecord[] {
	return [...sessionMetrics];
}

export function clearMetrics(): void {
	sessionMetrics.length = 0;
}

export function getMetricsSummary(): string {
	if (sessionMetrics.length === 0) {
		return "No metrics recorded yet";
	}

	const totalOriginal = sessionMetrics.reduce((sum, m) => sum + m.originalChars, 0);
	const totalFiltered = sessionMetrics.reduce((sum, m) => sum + m.filteredChars, 0);
	const avgSavings =
		sessionMetrics.reduce((sum, m) => sum + m.savingsPercent, 0) /
		sessionMetrics.length;

	const byTool = sessionMetrics.reduce((acc, m) => {
		if (!acc[m.tool]) {
			acc[m.tool] = { count: 0, savings: 0 };
		}
		acc[m.tool].count++;
		acc[m.tool].savings += m.savingsPercent;
		return acc;
	}, {} as Record<string, { count: number; savings: number }>);

	let summary = `RTK Token Savings Summary\n`;
	summary += `═══════════════════════\n`;
	summary += `Total calls: ${sessionMetrics.length}\n`;
	summary += `Original chars: ${totalOriginal.toLocaleString()}\n`;
	summary += `Filtered chars: ${totalFiltered.toLocaleString()}\n`;
	summary += `Space saved: ${(totalOriginal - totalFiltered).toLocaleString()} chars (${avgSavings.toFixed(1)}%)\n\n`;

	summary += `By tool:\n`;
	for (const [tool, data] of Object.entries(byTool)) {
		summary += `  ${tool}: ${data.count} calls (${(data.savings / data.count).toFixed(1)}% avg savings)\n`;
	}

	return summary;
}

export function getLastMetrics(n: number): MetricRecord[] {
	return sessionMetrics.slice(-n);
}
