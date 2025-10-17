import { ODAVLDataService } from '../services/ODAVLDataService';
import { SystemMetrics, HistoryEntry } from '../types/ODAVLTypes';
import { EventEmitter } from 'vscode';

export class DashboardDataService {
    private readonly dataService: ODAVLDataService;
    private readonly _onDidChange: EventEmitter<void> = new EventEmitter<void>();
    public readonly onDidChange = this._onDidChange.event;

    constructor(dataService: ODAVLDataService) {
        this.dataService = dataService;
        this.dataService.onMetricsChanged(() => this._onDidChange.fire());
        this.dataService.onHistoryChanged(() => this._onDidChange.fire());
    }

    async getCurrentMetrics(): Promise<SystemMetrics | undefined> {
        return await this.dataService.getCurrentMetrics();
    }

    async getHistoryEntries(limit = 1): Promise<HistoryEntry[] | undefined> {
        return await this.dataService.getHistoryEntries(limit);
    }

    dispose(): void {
        // No-op for now
    }
}
