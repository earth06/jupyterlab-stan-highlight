import { stanLanguage } from './stan-lang.js';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { EditorExtensionRegistry, EditorLanguageRegistry } from '@jupyterlab/codemirror';

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
 * Apply Stan highlighting to a cell if it starts with %%stan
 */
function highlightStanCell(cell, languageRegistry) {
  if (!cell || !(cell instanceof CodeCell)) return;

  const model = cell.model;
  if (!model) return;

  const source = model.sharedModel.getSource();
  const firstLine = source.split('\n')[0].trim();

  if (firstLine.startsWith('%%stan')) {
    // Force the language to be Stan
    try {
      if (languageRegistry) {
        const editor = cell.editor;
        if (editor && editor.state) {
          // Use the language registry to set the language
          languageRegistry.addLanguage({
            name: 'stan',
            mime: 'text/x-stan',
            load: () => Promise.resolve(stanLanguage)
          });
        }
      }
    } catch (error) {
      console.warn('Failed to set Stan mode:', error);
    }
  }
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

    // Function to highlight all cells in a notebook
    const highlightNotebook = (notebook) => {
      if (!notebook) return;

      notebook.content.widgets.forEach((cell) => {
        highlightStanCell(cell, languageRegistry);
      });
    };

    // Highlight cells when notebook changes
    tracker.currentChanged.connect((tracker, notebook) => {
      if (notebook) {
        notebook.revealed.then(() => {
          highlightNotebook(notebook);
        });
      }
    });

    // Highlight active cell when it changes
    tracker.activeCellChanged.connect((tracker, activeCell) => {
      highlightStanCell(activeCell, languageRegistry);
    });

    // Highlight cells when a new notebook is added
    tracker.widgetAdded.connect((tracker, notebook) => {
      notebook.revealed.then(() => {
        highlightNotebook(notebook);
      });
    });
  }
};

export default [extension];
