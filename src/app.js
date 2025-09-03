const { ipcRenderer } = require('electron');

class StickierNote {
    constructor() {
        this.noteData = {
            note: '',
            noteColor: '#FFFF88',
            textColor: '#000000',
            textContent: '',
            htmlContent: ''
        };
        
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeStart = { width: 0, height: 0, x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        this.loadNote();
        this.setupEventListeners();
        this.applyStyles();
        this.addInitialAnimation();
    }
    
    addInitialAnimation() {
        const container = document.getElementById('noteContainer');
        container.style.opacity = '0';
        container.style.transform = 'scale(0.9) translateY(20px)';
        
        setTimeout(() => {
            container.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            container.style.opacity = '1';
            container.style.transform = 'scale(1) translateY(0)';
        }, 100);
    }
    
    setupEventListeners() {
        // Header controls
        document.getElementById('minimizeBtn').addEventListener('click', () => {
            this.animateButtonClick('minimizeBtn');
            setTimeout(() => {
                ipcRenderer.send('minimize-window');
            }, 150);
        });
        
        document.getElementById('closeBtn').addEventListener('click', () => {
            this.animateButtonClick('closeBtn');
            setTimeout(() => {
                ipcRenderer.send('close-window');
            }, 150);
        });
        
        // Toolbar
        document.getElementById('boldBtn').addEventListener('click', () => {
            this.toggleBold();
        });
        
        document.getElementById('italicBtn').addEventListener('click', () => {
            this.toggleItalic();
        });
        
        document.getElementById('checkboxBtn').addEventListener('click', () => {
            this.smartInsertCheckbox();
        });
        
        document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
            this.changeFontSize(e.target.value);
        });
        
        // Color controls
        document.getElementById('noteColorPicker').addEventListener('change', (e) => {
            this.noteData.noteColor = e.target.value;
            this.applyStyles();
            this.saveNote();
        });
        
        document.getElementById('textColorPicker').addEventListener('change', (e) => {
            this.noteData.textColor = e.target.value;
            this.applyStyles();
            this.updateAllCheckboxColors(this.noteData.textColor);
            this.saveNote();
        });

        // Minimal color icon buttons open hidden color inputs
        const noteColorBtn = document.getElementById('noteColorBtn');
        const textColorBtn = document.getElementById('textColorBtn');
        if (noteColorBtn) {
            noteColorBtn.addEventListener('click', () => {
                document.getElementById('noteColorPicker').click();
            });
        }
        if (textColorBtn) {
            textColorBtn.addEventListener('click', () => {
                document.getElementById('textColorPicker').click();
            });
        }
        
        // Editor
        const editor = document.getElementById('editor');
        editor.addEventListener('input', () => {
            this.handleEditorChange();
        });
        
        editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
        
        editor.addEventListener('focus', () => {
            this.addEditorFocusEffect();
        });
        
        editor.addEventListener('blur', () => {
            this.removeEditorFocusEffect();
            this.saveNote();
        });

        // Update toolbar state on selection changes
        editor.addEventListener('mouseup', () => this.updateToolbarState());
        editor.addEventListener('keyup', () => this.updateToolbarState());

        // Handle checkbox clicks to save state
        editor.addEventListener('click', (event) => {
            const target = event.target;
            if (target && target.tagName === 'INPUT' && target.type === 'checkbox') {
                setTimeout(() => this.handleEditorChange(), 0);
            }
        });
        
        // Use Electron's drag regions; no custom DOM dragging/resizing
        
        // Auto-save on blur
        editor.addEventListener('blur', () => {
            this.saveNote();
        });
    }
    
    animateButtonClick(buttonId) {
        const button = document.getElementById(buttonId);
        button.style.transform = 'scale(0.8)';
        button.style.transition = 'transform 0.15s ease';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }
    
    addEditorFocusEffect() {
        // No-op: Remove scale animation on editor focus
    }
    
    removeEditorFocusEffect() {
        // No-op: Remove scale animation on editor blur
    }
    
    toggleBold() {
        document.execCommand('bold', false);
        this.updateToolbarState();
        this.animateToolButton('boldBtn');
    }
    
    toggleItalic() {
        document.execCommand('italic', false);
        this.updateToolbarState();
        this.animateToolButton('italicBtn');
    }
    
    changeFontSize(size) {
        document.execCommand('fontSize', false, size);
        this.animateToolButton('fontSizeSelect');
    }
    
    insertCheckbox() {
        const checkboxHtml = `<span class="checkbox-item"><input type="checkbox" style="border-color: ${this.noteData.textColor}; color: ${this.noteData.textColor};" /><span contenteditable="true"> New task</span></span>`;
        document.execCommand('insertHTML', false, checkboxHtml);
        this.handleEditorChange();
        this.animateToolButton('checkboxBtn');
    }

    // Convert selected text to a checkbox item if selection exists
    convertSelectedTextToCheckbox() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            this.insertCheckbox();
            return;
        }

        const selText = selection.toString().trim();
        if (selText === '') {
            this.insertCheckbox();
            return;
        }

        // Prevent double-wrapping if already inside a checkbox-item
        const range = selection.getRangeAt(0);
        let node = range.commonAncestorContainer;
        while (node && node !== document.getElementById('editor')) {
            if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('checkbox-item')) {
                return;
            }
            node = node.parentNode;
        }

        const checkboxHtml = `<span class="checkbox-item"><input type="checkbox" style="border-color: ${this.noteData.textColor}; color: ${this.noteData.textColor};" /><span contenteditable="true">${selection.toString()}</span></span>`;
        document.execCommand('delete', false);
        document.execCommand('insertHTML', false, checkboxHtml);
        this.handleEditorChange();
    }

    // Smart behavior: if selection empty, insert; if text selected, convert; if on empty line, insert
    smartInsertCheckbox() {
        const editor = document.getElementById('editor');
        editor.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            this.insertCheckbox();
            return;
        }

        const selText = selection.toString().trim();
        if (selText === '') {
            const range = selection.getRangeAt(0);
            const node = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) {
                const textBefore = node.textContent?.substring(0, range.startOffset) || '';
                const textAfter = node.textContent?.substring(range.startOffset) || '';
                const emptyLine = (/^\s*$/.test(textBefore)) && (/^\s*$/.test(textAfter));
                if (emptyLine) {
                    this.insertCheckbox();
                    return;
                }
                // Select whole line and convert
                const lineStart = textBefore.lastIndexOf('\n') + 1;
                const lineEndIdx = textAfter.indexOf('\n');
                const endPos = lineEndIdx > -1 ? range.startOffset + lineEndIdx : (node.textContent?.length || 0);
                const lineRange = document.createRange();
                lineRange.setStart(node, lineStart);
                lineRange.setEnd(node, endPos);
                selection.removeAllRanges();
                selection.addRange(lineRange);
                this.convertSelectedTextToCheckbox();
                return;
            }
            this.insertCheckbox();
            return;
        }
        this.convertSelectedTextToCheckbox();
    }

    handleEditorKeydown(event) {
        // Ctrl/Cmd+Shift+C to convert selected text to checkbox
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            this.convertSelectedTextToCheckbox();
            return;
        }

        if (event.key === 'Enter') {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            // Detect if caret inside checkbox text and at end
            let node = selection.anchorNode;
            let checkboxItem = null;
            let isAtEnd = false;

            while (node && node !== document.getElementById('editor')) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node;
                    if (el.parentElement && el.parentElement.classList && el.parentElement.classList.contains('checkbox-item')) {
                        checkboxItem = el.parentElement;
                        if (selection.anchorOffset === (node.textContent || '').length) {
                            isAtEnd = true;
                        }
                        break;
                    }
                    if (el.classList && el.classList.contains('checkbox-item')) {
                        checkboxItem = el;
                        break;
                    }
                }
                node = node.parentNode;
            }

            if (!isAtEnd && node && node.nodeType === Node.TEXT_NODE && node.parentElement && node.parentElement.parentElement && node.parentElement.parentElement.classList && node.parentElement.parentElement.classList.contains('checkbox-item')) {
                if (selection.anchorOffset === (node.textContent || '').length) {
                    isAtEnd = true;
                    checkboxItem = node.parentElement.parentElement;
                }
            }

            if (checkboxItem) {
                event.preventDefault();
                const html = `<br><span class=\"checkbox-item\"><input type=\"checkbox\" style=\"border-color: ${this.noteData.textColor}; color: ${this.noteData.textColor};\" /><span contenteditable=\"true\"> New task</span></span>`;
                const range = document.createRange();
                range.setStartAfter(checkboxItem);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('insertHTML', false, html);
                this.handleEditorChange();
                return;
            }

            // Default enter inserts paragraph spacing
            event.preventDefault();
            document.execCommand('insertHTML', false, '<br><br>');
            this.handleEditorChange();
            return;
        }

        if (event.key === 'Backspace') {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            const range = selection.getRangeAt(0);
            if (range.startOffset === 0 && range.collapsed) {
                let node = range.startContainer;
                let checkboxItem = null;
                while (node && node !== document.getElementById('editor')) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node;
                        if (el.parentElement && el.parentElement.classList && el.parentElement.classList.contains('checkbox-item')) {
                            checkboxItem = el.parentElement;
                            break;
                        }
                        if (el.classList && el.classList.contains('checkbox-item')) {
                            checkboxItem = el;
                            break;
                        }
                    }
                    node = node.parentNode;
                }
                if (checkboxItem) {
                    event.preventDefault();
                    checkboxItem.remove();
                    this.handleEditorChange();
                }
            }
        }
    }

    updateAllCheckboxColors(color) {
        const editor = document.getElementById('editor');
        if (!editor) return;
        const checkboxes = editor.querySelectorAll('.checkbox-item input[type="checkbox"]');
        checkboxes.forEach((input) => {
            input.style.borderColor = color;
            input.style.color = color;
        });
    }
    
    animateToolButton(buttonId) {
        const button = document.getElementById(buttonId);
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
    }
    
    updateToolbarState() {
        const boldBtn = document.getElementById('boldBtn');
        const italicBtn = document.getElementById('italicBtn');
        
        boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        italicBtn.classList.toggle('active', document.queryCommandState('italic'));
    }
    
    handleEditorChange() {
        const editor = document.getElementById('editor');
        this.noteData.note = editor.textContent || '';
        this.noteData.htmlContent = editor.innerHTML;
        this.noteData.textContent = editor.innerHTML;
        
        // Auto-save after a delay
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveNote();
        }, 1000);
    }
    
    startDragging(e) {
        this.isDragging = true;
        const rect = document.getElementById('noteContainer').getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        document.body.style.cursor = 'move';
        
        // Add dragging effect
        const container = document.getElementById('noteContainer');
        container.style.transition = 'none';
        container.style.transform = 'scale(1.05)';
        container.style.zIndex = '1000';
    }
    
    handleDragging(e) {
        if (!this.isDragging) return;
        
        const container = document.getElementById('noteContainer');
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;
        
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
    }
    
    stopDragging() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        document.body.style.cursor = 'default';
        
        // Remove dragging effect
        const container = document.getElementById('noteContainer');
        container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.transform = 'scale(1)';
        container.style.zIndex = 'auto';
    }
    
    startResizing(e) {
        this.isResizing = true;
        const container = document.getElementById('noteContainer');
        const rect = container.getBoundingClientRect();
        
        this.resizeStart = {
            width: rect.width,
            height: rect.height,
            x: e.clientX,
            y: e.clientY
        };
        
        document.body.style.cursor = 'se-resize';
        container.style.transition = 'none';
    }
    
    handleResizing(e) {
        if (!this.isResizing) return;
        
        const container = document.getElementById('noteContainer');
        const deltaX = e.clientX - this.resizeStart.x;
        const deltaY = e.clientY - this.resizeStart.y;
        
        const newWidth = Math.max(300, this.resizeStart.width + deltaX);
        const newHeight = Math.max(350, this.resizeStart.height + deltaY);
        
        container.style.width = `${newWidth}px`;
        container.style.height = `${newHeight}px`;
    }
    
    stopResizing() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        document.body.style.cursor = 'default';
        
        const container = document.getElementById('noteContainer');
        container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    applyStyles() {
        const container = document.getElementById('noteContainer');
        const editor = document.getElementById('editor');
        
        container.style.backgroundColor = this.noteData.noteColor;
        editor.style.color = this.noteData.textColor;
        
        // Add smooth transition for color changes
        container.style.transition = 'background-color 0.3s ease';
        editor.style.transition = 'color 0.3s ease';
    }
    
    async loadNote() {
        try {
            const noteData = await ipcRenderer.invoke('get-note');
            if (noteData) {
                this.noteData = { ...this.noteData, ...noteData };
                this.applyStyles();
                
                const editor = document.getElementById('editor');
                if (this.noteData.htmlContent) {
                    editor.innerHTML = this.noteData.htmlContent;
                } else if (this.noteData.textContent) {
                    editor.innerHTML = this.noteData.textContent;
                }
            }
        } catch (error) {
            console.error('Error loading note:', error);
        }
    }
    
    async saveNote() {
        try {
            await ipcRenderer.invoke('save-note', this.noteData);
        } catch (error) {
            console.error('Error saving note:', error);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StickierNote();
});
