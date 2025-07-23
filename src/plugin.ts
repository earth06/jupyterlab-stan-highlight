import { stanLanguage } from './stan-lang';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CodeCell, Cell } from '@jupyterlab/cells';
import { EditorLanguageRegistry } from '@jupyterlab/codemirror';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

/**
 * Register Stan file type
 */
function registerStanFileType(app: JupyterFrontEnd): void {
  app.docRegistry.addFileType({
    name: 'stan',
    displayName: 'Stan',
    extensions: ['stan'],
    mimeTypes: ['text/x-stan'],
  });
}

/**
 * Check if a cell starts with %%stan magic command
 */
function isStanCell(cell: CodeCell | null): boolean {
  if (!cell || !(cell instanceof CodeCell)) return false;

  const source = cell.model.sharedModel.getSource();
  const firstLine = source.split('\n')[0].trim();
  return firstLine.startsWith('%%stan');
}

/**
 * Apply Stan highlighting to a cell
 */
function applyStanHighlighting(cell: CodeCell): void {
  if (!isStanCell(cell)) return;

  try {
    const editor = cell.editor;
    if (editor) {
      // Set the MIME type for the cell to use Stan highlighting
      cell.model.mimeType = 'text/x-stan';
    }
  } catch (error) {
    console.warn('Failed to apply Stan highlighting:', error);
  }
}

/**
 * Process all cells in a notebook
 */
function processNotebook(notebook: NotebookPanel | null): void {
  if (!notebook) return;

  notebook.content.widgets.forEach((cell) => {
    if (cell instanceof CodeCell) {
      applyStanHighlighting(cell);
    }
  });
}

/**
 * JupyterLab extension definition
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-stan-highlight',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [EditorLanguageRegistry],
  activate: function (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    languageRegistry?: EditorLanguageRegistry
  ): void {
    console.log('JupyterLab extension jupyterlab-stan-highlight is activated!');

    // Register Stan file type
    registerStanFileType(app);

    // Register Stan language
    if (languageRegistry) {
      languageRegistry.addLanguage({
        name: 'stan',
        mime: 'text/x-stan',
        extensions: ['stan'],
        load: () => Promise.resolve(stanLanguage)
      });
    }

    // Process notebooks when they change
    tracker.currentChanged.connect((tracker, notebook) => {
      if (notebook) {
        notebook.revealed.then(() => {
          processNotebook(notebook);
        });
      }
    });

    // Process active cell when it changes
    tracker.activeCellChanged.connect((tracker, activeCell) => {
      if (activeCell instanceof CodeCell) {
        applyStanHighlighting(activeCell);
      }
    });

    // Process new notebooks
    tracker.widgetAdded.connect((tracker, notebook) => {
      notebook.revealed.then(() => {
        processNotebook(notebook);
      });
    });
  }
};

export default [extension];
