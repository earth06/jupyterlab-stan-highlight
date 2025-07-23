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
      // Force the editor to use Stan mode
      const editorView = editor.editor;
      if (editorView && editorView.dispatch) {
        // Try to change the language mode
        console.log('Applying Stan highlighting to cell');

        // Set MIME type
        cell.model.mimeType = 'text/x-stan';

        // Try to reconfigure the editor
        if (editor.setOption) {
          editor.setOption('mode', 'text/x-stan');
        }
      }
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
      try {
        languageRegistry.addLanguage({
          name: 'stan',
          mime: 'text/x-stan',
          extensions: ['stan'],
          load: async () => {
            return stanLanguage as any;
          }
        });
        console.log('Stan language registered successfully');
      } catch (error) {
        console.warn('Failed to register Stan language:', error);
      }
    }

    // Function to check and apply highlighting to all cells
    const checkAllCells = (notebook: any) => {
      if (!notebook) return;

      console.log('Checking all cells for Stan magic');
      notebook.content.widgets.forEach((cell: any, index: number) => {
        if (cell instanceof CodeCell) {
          const source = cell.model.sharedModel.getSource();
          const firstLine = source.split('\n')[0].trim();
          if (firstLine.startsWith('%%stan')) {
            console.log(`Found Stan cell at index ${index}`);
            applyStanHighlighting(cell);
          }
        }
      });
    };

    // Monitor cell content changes
    const setupCellMonitoring = (notebook: any) => {
      if (!notebook) return;

      // Monitor each cell for content changes
      notebook.content.widgets.forEach((cell: any) => {
        if (cell instanceof CodeCell) {
          // Listen to model changes
          cell.model.contentChanged.connect(() => {
            setTimeout(() => applyStanHighlighting(cell), 100);
          });
        }
      });

      // Monitor when new cells are added
      notebook.content.model.cells.changed.connect(() => {
        setTimeout(() => checkAllCells(notebook), 100);
      });
    };

    // Process notebooks when they change
    tracker.currentChanged.connect((tracker: any, notebook: any) => {
      if (notebook) {
        notebook.revealed.then(() => {
          console.log('Notebook changed, setting up monitoring');
          checkAllCells(notebook);
          setupCellMonitoring(notebook);
        });
      }
    });

    // Process active cell when it changes
    tracker.activeCellChanged.connect((tracker: any, activeCell: any) => {
      if (activeCell instanceof CodeCell) {
        console.log('Active cell changed, checking for Stan magic');
        applyStanHighlighting(activeCell);
      }
    });

    // Process new notebooks
    tracker.widgetAdded.connect((tracker: any, notebook: any) => {
      notebook.revealed.then(() => {
        console.log('New notebook added, setting up monitoring');
        checkAllCells(notebook);
        setupCellMonitoring(notebook);
      });
    });

    // Process current notebook if it already exists
    if (tracker.currentWidget) {
      console.log('Processing existing notebook');
      checkAllCells(tracker.currentWidget);
      setupCellMonitoring(tracker.currentWidget);
    }
  }
};

export default [extension];
