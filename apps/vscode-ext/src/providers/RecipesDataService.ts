import { ODAVLDataService } from '../services/ODAVLDataService';
import { RecipeTrust } from '../types/ODAVLTypes';
import { EventEmitter } from 'vscode';

export class RecipesDataService {
    private readonly dataService: ODAVLDataService;
    private readonly _onDidChange: EventEmitter<void> = new EventEmitter<void>();
    public readonly onDidChange = this._onDidChange.event;

    constructor(dataService: ODAVLDataService) {
        this.dataService = dataService;
        // If ODAVLDataService exposes recipe trust change events, wire here. For now, no-op.
    }

    getRecipeTrust(): Promise<RecipeTrust[]> {
        return this.dataService.getRecipeTrust();
    }

    dispose(): void {
        // No-op for now
    }
}
