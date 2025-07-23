import { stanLanguage } from './stan-lang.js';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { EditorLanguageRegistry } from '@jupyterlab/codemirror';

/**
 * Register Stan file type
 */
function registerStanFileType(app) {
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
function isStanCell(cell) {
  if (!cell || !(cell instanceof CodeCell)) return false;

  const source = cell.model.sharedModel.getSource();
  const firstLine = source.split('\n')[0].trim();
  return firstLine.startsWith('%%stan');
}

/**
 * Apply Stan highlighting to a cell
 */
function applyStanHighlighting(cell) {
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
function processNotebook(notebook) {
  if (!notebook) return;

  notebook.content.widgets.forEach(cell => {
    if (cell instanceof CodeCell) {
      applyStanHighlighting(cell);
    }
  });
}

/**
 * JupyterLab extension definition
 */
const extension = {
  id: 'jupyterlab-stan-highlight',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [EditorLanguageRegistry],

  activate: function (app, tracker, languageRegistry) {
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

    // Process existing notebooks
    if (tracker.currentWidget) {
      processNotebook(tracker.currentWidget);
    }

    // Listen for notebook changes
    tracker.currentChanged.connect((sender, notebook) => {
      if (notebook) {
        notebook.revealed.then(() => processNotebook(notebook));
      }
    });

    // Listen for new notebooks being added
    tracker.widgetAdded.connect((sender, notebook) => {
      notebook.revealed.then(() => processNotebook(notebook));
    });

    // Listen for active cell changes to re-check highlighting
    tracker.activeCellChanged.connect((sender, cell) => {
      if (cell instanceof CodeCell) {
        applyStanHighlighting(cell);
      }
    });

    // Listen for cell content changes
    tracker.currentWidget?.content.modelContentChanged.connect(() => {
      processNotebook(tracker.currentWidget);
    });

    console.log('Stan syntax highlighting extension loaded successfully');
  }
};

export default [extension];
