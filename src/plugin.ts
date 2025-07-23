import { stanLanguage } from './stan-lang';

// @ts-ignore
import { INotebookTracker } from '@jupyterlab/notebook';
// @ts-ignore  
import { CodeCell } from '@jupyterlab/cells';
// @ts-ignore
import { EditorLanguageRegistry } from '@jupyterlab/codemirror';

/**
 * Register Stan file type
 */
function registerStanFileType(app: any): void {
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
function isStanCell(cell: any): boolean {
  if (!cell || !(cell instanceof CodeCell)) return false;

  const source = cell.model.sharedModel.getSource();
  const firstLine = source.split('\n')[0].trim();
  return firstLine.startsWith('%%stan');
}

/**
 * Apply Stan highlighting to a cell
 */
function applyStanHighlighting(cell: any): void {
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
function processNotebook(notebook: any): void {
  if (!notebook) return;

  notebook.content.widgets.forEach((cell: any) => {
    if (cell instanceof CodeCell) {
      applyStanHighlighting(cell);
    }
  });
}

/**
 * JupyterLab extension definition
 */
const extension: any = {
  id: 'jupyterlab-stan-highlight',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [EditorLanguageRegistry],
  activate: function (
    app: any,
    tracker: any,
    languageRegistry?: any
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
        load: () => Promise.resolve(stanLanguage as any)
      });
    }

    // Process notebooks when they change
    tracker.currentChanged.connect((tracker: any, notebook: any) => {
      if (notebook) {
        notebook.revealed.then(() => {
          processNotebook(notebook);
        });
      }
    });

    // Process active cell when it changes
    tracker.activeCellChanged.connect((tracker: any, activeCell: any) => {
      if (activeCell instanceof CodeCell) {
        applyStanHighlighting(activeCell);
      }
    });

    // Process new notebooks
    tracker.widgetAdded.connect((tracker: any, notebook: any) => {
      notebook.revealed.then(() => {
        processNotebook(notebook);
      });
    });
  }
};

export default [extension];
