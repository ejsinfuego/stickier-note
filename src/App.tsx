import { useState, useEffect, useRef } from 'react';
import './App.css';

const { ipcRenderer } = window.require('electron');

function App() {
  const [note, setNote] = useState('');
  const [opacity] = useState(1);
  const [isClickThrough] = useState(false);
  const [noteColor, setNoteColor] = useState('#FFFF88');
  const [textColor, setTextColor] = useState('#000000');
  const [textContent, setTextContent] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  interface NoteData {
    note: string;
    noteColor: string;
    textColor: string;
    textContent: string;
    htmlContent?: string; // Add HTML content to preserve formatting
  }

const toggleBold = () => {
  if (editorRef.current) {
    editorRef.current.focus();
    document.execCommand('bold', false);
    setIsBold(document.queryCommandState('bold'));
  }
};
  
const toggleItalic = () => {
  if (editorRef.current) {
    editorRef.current.focus();
    document.execCommand('italic', false);
    setIsItalic(document.queryCommandState('italic'));
  }
};

const changeFontSize = (size: string) => {
  if (editorRef.current) {
    editorRef.current.focus();
    document.execCommand('fontSize', false, size);
  }
};

// Add a function to track formatting state
const checkFormatting = () => {
  if (editorRef.current) {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
  }
};
const handleEditorChange = () => {
  if (editorRef.current) {
    setNote(editorRef.current.textContent || '');
    // Store the innerHTML which preserves formatting
    if (editorRef.current.innerHTML) {
      setTextContent(editorRef.current.innerHTML);
    }
  }
};

// Fix insertCheckbox function to ensure proper structure
const insertCheckbox = () => {
  if (editorRef.current) {
    editorRef.current.focus();
    
    // Create a checkbox element with a cleaner structure
    const checkboxHtml = `<span class="checkbox-item"><input type="checkbox" style="border-color: ${textColor}; color: ${textColor};" /><span contenteditable="true"> New task</span></span>`;
    
    // Insert the checkbox at cursor position
    document.execCommand('insertHTML', false, checkboxHtml);
    
    // Update the note content
    handleEditorChange();
  }
};

// Fix the convertSelectedTextToCheckbox function to ensure proper structure
const convertSelectedTextToCheckbox = () => {
  if (editorRef.current) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      insertCheckbox();
      return;
    }

    const selText = selection.toString().trim();
    if (selText === '') {
      insertCheckbox();
      return;
    }

    // Get the selection range
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Check if selection is already within a checkbox
    let isInsideCheckbox = false;
    let node: Node | null = container;
    
    // Traverse up the DOM tree to check for checkbox-item class
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.classList && element.classList.contains('checkbox-item')) {
          isInsideCheckbox = true;
          break;
        }
      }
      node = node.parentNode;
    }
    
    // If already inside a checkbox, do nothing
    if (isInsideCheckbox) {
      return;
    }
    
    // Create and insert the checkbox without the line break
    const selectedText = selection.toString();
    const checkboxHtml = `<span class="checkbox-item"><input type="checkbox" style="border-color: ${textColor}; color: ${textColor};" /><span contenteditable="true">${selectedText}</span></span>`;
    
    // Delete the selected content and insert the new checkbox
    document.execCommand('delete', false);
    document.execCommand('insertHTML', false, checkboxHtml);
    
    // Update the note content
    handleEditorChange();
  }
};

// Combine checkbox functionality into a single smart function
const smartInsertCheckbox = () => {
  if (editorRef.current) {
    editorRef.current.focus();
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      // No selection, insert a new checkbox
      insertCheckbox();
      return;
    }

    const selText = selection.toString().trim();
    
    if (selText === '') {
      // Empty selection, check if we're in an empty line
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      
      // Check if the line is empty
      if (node.nodeType === Node.TEXT_NODE) {
        const textBeforeCursor = node.textContent?.substring(0, range.startOffset) || '';
        const textAfterCursor = node.textContent?.substring(range.startOffset) || '';
        
        // If the line has no text (or only whitespace), insert a new checkbox
        if ((!textBeforeCursor || /^\s*$/.test(textBeforeCursor)) && 
            (!textAfterCursor || /^\s*$/.test(textAfterCursor))) {
          insertCheckbox();
          return;
        } else {
          // There's text in the line but no selection, try to select the whole line
          const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
          const lineEnd = textAfterCursor.indexOf('\n');
          const endPosition = lineEnd > -1 ? range.startOffset + lineEnd : node.textContent?.length || 0;
          
          // Create a new range for the whole line
          const lineRange = document.createRange();
          lineRange.setStart(node, lineStart);
          lineRange.setEnd(node, endPosition);
          
          // Apply the selection
          selection.removeAllRanges();
          selection.addRange(lineRange);
          
          // Convert the selected text to checkbox
          convertSelectedTextToCheckbox();
          return;
        }
      } else {
        // Default to inserting a new checkbox
        insertCheckbox();
        return;
      }
    } else {
      // There's selected text, convert it to checkbox
      convertSelectedTextToCheckbox();
    }
  }
};

const updateAllCheckboxColors = (color: string) => {
  if (editorRef.current) {
    const checkboxes = editorRef.current.querySelectorAll('.checkbox-item input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      const checkboxElement = checkbox as HTMLElement;
      checkboxElement.style.borderColor = color;
      checkboxElement.style.color = color;
    });
  }
};

  useEffect(() => {
    if (note === '' && noteColor === '#FFFF88' && textColor === '#000000') return;
    const noteData = {
      note,
      noteColor,
      textColor,
      textContent,
      htmlContent: editorRef.current?.innerHTML || '' // Save HTML content
    };
    
    ipcRenderer.invoke('save-note', noteData);
  }, [note, noteColor, textColor, textContent]);

  useEffect(() => {
    ipcRenderer.invoke('get-note').then((noteData: NoteData) => {
      if (noteData) {
        setNote(noteData.note || '');
        setNoteColor(noteData.noteColor || '#FFFF88');
        setTextColor(noteData.textColor || '#000000');
        setTextContent(noteData.textContent || '');
        
        // Set the editor content from saved note - use HTML content if available
        if (editorRef.current) {
          if (noteData.htmlContent) {
            editorRef.current.innerHTML = noteData.htmlContent;
          } else if (noteData.note) {
            editorRef.current.textContent = noteData.note;
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    ipcRenderer.send('set-opacity', opacity);
  }, [opacity]);

  useEffect(() => {
    ipcRenderer.send('set-ignore-mouse-events', isClickThrough, { forward: true });
  }, [isClickThrough]);

  useEffect(() => {
    // Add event listener for checkbox clicks
    const handleCheckboxClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the clicked element is a checkbox
      if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
        // Update the note content after checkbox state changes
        setTimeout(() => {
          handleEditorChange();
        }, 0);
      }
    };

    // Add event listener to the editor element
    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('click', handleCheckboxClick);
    }

    // Clean up the event listener when component unmounts
    return () => {
      if (editorElement) {
        editorElement.removeEventListener('click', handleCheckboxClick);
      }
    };
  }, []);

  // Clean up the Enter key handling to work correctly with checkboxes
  useEffect(() => {
    // Add keyboard handlers for checkboxes
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+C (or Cmd+Shift+C on Mac) to convert selected text to checkbox
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        convertSelectedTextToCheckbox();
        return;
      }
      
      // Handle Enter key inside checkbox text or in general
      if (event.key === 'Enter') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        // Find if we're inside or at the end of a checkbox item
        let node = selection.anchorNode;
        let checkboxItem: Element | null = null;
        let isAtEndOfCheckbox = false;
        
        // Check if we're inside a checkbox text span
        while (node && node !== editorRef.current) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Check if we're in a span inside a checkbox-item
            if (element.parentElement?.classList.contains('checkbox-item')) {
              checkboxItem = element.parentElement;
              // Check if cursor is at the end of the text content
              if (selection.anchorOffset === (node.textContent || '').length) {
                isAtEndOfCheckbox = true;
              }
              break;
            }
            // Direct child of checkbox-item
            if (element.classList.contains('checkbox-item')) {
              checkboxItem = element;
              break;
            }
          }
          node = node.parentNode;
        }

        // Also check if we're at the end of a text node inside a checkbox
        if (!isAtEndOfCheckbox && node && node.nodeType === Node.TEXT_NODE && node.parentElement) {
          const parentSpan = node.parentElement;
          if (parentSpan.parentElement?.classList.contains('checkbox-item')) {
            checkboxItem = parentSpan.parentElement;
            // Check if cursor is at the end of the text
            if (selection.anchorOffset === node.textContent?.length) {
              isAtEndOfCheckbox = true;
            }
          }
        }
        
        // If we're inside a checkbox or at the end of a checkbox text
        if (checkboxItem) {
          event.preventDefault(); // Prevent default Enter behavior
          
          // Create a new checkbox with explicit <br> for line break
          const newCheckboxHtml = `<br><span class="checkbox-item"><input type="checkbox" style="border-color: ${textColor}; color: ${textColor};" /><span contenteditable="true"> New task</span></span>`;
          
          // Insert after the current checkbox
          if (checkboxItem.parentNode) {
            // Move the selection after the current checkbox
            const range = document.createRange();
            range.setStartAfter(checkboxItem);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Insert the new checkbox
            document.execCommand('insertHTML', false, newCheckboxHtml);
            handleEditorChange();
          }
          return;
        } else {
          // When not in a checkbox, handle regular Enter key
          event.preventDefault();
          document.execCommand('insertHTML', false, '<br><br>');
          handleEditorChange();
          return;
        }
      }
      
      // Handle backspace for checkboxes
      if (event.key === 'Backspace') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        
        // Check if the caret is at the beginning of a checkbox item's text span
        if (range.startOffset === 0 && range.collapsed) {
          // Find closest parent checkbox item
          let node: Node | null = range.startContainer;
          let checkboxItem: Element | null = null;
          
          while (node && node !== editorRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // If we're inside the text span of a checkbox
              if (element.parentElement?.classList.contains('checkbox-item')) {
                checkboxItem = element.parentElement;
                break;
              }
              // If we're directly on the checkbox item
              if (element.classList.contains('checkbox-item')) {
                checkboxItem = element;
                break;
              }
            }
            node = node.parentNode;
          }
          
          // If caret is at beginning of a checkbox text, delete the whole checkbox
          if (checkboxItem) {
            event.preventDefault();
            checkboxItem.remove();
            handleEditorChange();
          }
        }
      }
    };

    // Add the keyboard event listener to the editor
    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown);
    }

    // Clean up event listener
    return () => {
      if (editorElement) {
        editorElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [textColor]);

  return (
    <div 
      className="sticky-note"
      style={{ backgroundColor: noteColor }}
    >
      <div className="note-header">
        <div className="note-controls">
          <div className="button-group">
          <button 
            className="control-btn close-btn"
            onClick={() => window.close()}
          >
            ×
          </button>
          <button className='control-btn minimize-btn' 
            onClick={() => ipcRenderer.send('minimize-window')}
          >
            {' —'}
          </button>
          </div>
          <div className="color-options">
            <select 
              className="color-picker"
              value={noteColor}
              onChange={(e) => setNoteColor(e.target.value)}
            >
              <option value="#FFFF88">Yellow</option>
              <option value="#FF7EB9">Pink</option>
              <option value="#7AFCFF">Blue</option>
              <option value="#DCFF7E">Green</option>
            </select>
            
            <select
              className="color-picker text-color-picker"
              value={textColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setTextContent(newColor);
                setTextColor(newColor);
                updateAllCheckboxColors(newColor);
                // Force re-render to update button styling
                setTimeout(() => {
                  setTextColor(prevColor => prevColor === newColor ? newColor : newColor);
                }, 0);
              }}
            >
              <option value="#000000">Black</option>
              <option value="#0000FF">Blue</option>
              <option value="#FF0000">Red</option>
              <option value="#008000">Green</option>
              <option value="#800080">Purple</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Formatting Toolbar */}
      <div className="formatting-toolbar">
        <button 
          className={`format-btn ${isBold ? 'active' : ''}`}
          onClick={toggleBold} 
          title="Bold"
          style={{ color: textColor, borderColor: textColor }}
        >
          <strong>B</strong>
        </button>
        <button 
          className={`format-btn ${isItalic ? 'active' : ''}`}
          onClick={toggleItalic} 
          title="Italic"
          style={{ color: textColor, borderColor: textColor }}
        >
          <em>I</em>
        </button>
        <button 
          className="format-btn checkbox-btn" 
          onClick={smartInsertCheckbox}
          title="Smart Checkbox (adds new checkbox or converts line to checkbox)"
          style={{ color: textColor, borderColor: textColor }}
        >
          ☑
        </button>
      </div>
      
      <div
      ref={editorRef}
      className="note-content editable"
      contentEditable={true}
      onInput={handleEditorChange}
      onMouseUp={checkFormatting}
      onKeyUp={checkFormatting}
      style={{ color: textColor }}
      onBlur={handleEditorChange}
      />
      </div>
  );
}

export default App;