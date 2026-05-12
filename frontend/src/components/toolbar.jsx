
function ToolbarTool({editor}) {
  return (
    <div>
        <div className = "toolbar">
            <button type = "button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : 'text-styler'}>
                <b>bold</b>
            </button>
            <button type = "button" onClick = {() => editor.chain().focus().toggleItalic().run()} className = {editor.isActive('italic') ? "is-active": "text-styler"}>
                <i>italic</i>
            </button>
            <button type = "button" onClick = {() => editor.chain().focus().toggleUnderline().run()} className = {editor.isActive('underline') ? "is-active": "text-styler"}>
                <u>underline</u>
            </button>
        </div>
    </div>
  )
}

export default ToolbarTool;