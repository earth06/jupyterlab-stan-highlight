import { stanLanguage } from './stan-lang';

// @ts-ignore
import { INotebookTracker } from '@jupyterlab/notebook';
// @ts-ignore  
import { CodeCell } from '@jupyterlab/cells';
// @ts-ignore
import { EditorLanguageRegistry } from '@jupyterlab/codemirror';

/**
 * Register Stan file type and language
 */
function registerStanFileType(app: any): void {
  // Register file type
  app.docRegistry.addFileType({
    name: 'stan',
    displayName: 'Stan',
    extensions: ['stan'],
    mimeTypes: ['text/x-stan'],
  });

  console.log('Stan file type registered');
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
    console.log('Applying Stan highlighting to cell');

    // Set the MIME type
    cell.model.mimeType = 'text/x-stan';

    const editor = cell.editor;
    if (editor && editor.editor) {
      const editorView = editor.editor;

      // For CodeMirror 6, try to reconfigure with Stan language
      if (editorView.dispatch && editorView.state) {
        try {
          // Create a transaction to change the language
          const transaction = editorView.state.update({
            effects: [
              // Try to apply the language configuration
              editorView.state.reconfigure({
                language: stanLanguage
              })
            ]
          });

          editorView.dispatch(transaction);
          console.log('Stan language transaction dispatched');

        } catch (configError) {
          console.warn('Failed to reconfigure editor with transaction:', configError);

          // Alternative approach: force editor refresh
          try {
            if (editor.refresh) {
              editor.refresh();
            }
            // Try to trigger a re-render
            setTimeout(() => {
              if (editor.focus) {
                editor.focus();
                editor.blur();
              }
            }, 100);
          } catch (refreshError) {
            console.warn('Failed to refresh editor:', refreshError);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to apply Stan highlighting:', error);
  }
}/**
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
    console.log('Available language registry:', !!languageRegistry);
    console.log('Stan language definition:', stanLanguage);

    // Register Stan file type
    registerStanFileType(app);

    // Register Stan language with multiple approaches
    if (languageRegistry) {
      try {
        // Method 1: Standard registration
        languageRegistry.addLanguage({
          name: 'stan',
          mime: 'text/x-stan',
          extensions: ['stan'],
          load: async () => {
            console.log('Loading Stan language definition');
            return stanLanguage as any;
          }
        });

        // Method 2: Try to register with additional mimes
        languageRegistry.addLanguage({
          name: 'stan-alt',
          mime: 'text/stan',
          extensions: ['stan'],
          load: async () => {
            return stanLanguage as any;
          }
        });

        console.log('Stan language registered successfully');
      } catch (error) {
        console.warn('Failed to register Stan language:', error);
      }
    } else {
      console.warn('Language registry not available');
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
