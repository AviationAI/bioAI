
function ToolbarTool({editor}: {editor: any}) {
  return (
    <div>
        <div className = "flex flex-row border-t border-r border-l border-b-0 rounded-t-md">
            <button type = "button" onClick={() => editor.chain().focus().toggleBold().run()} className = "bg-transparent m-0.5">
                <b>B</b>
            </button>
            <button type = "button" onClick = {() => editor.chain().focus().toggleItalic().run()} className = "bg-transparent m-0.5">
                <i>I</i>
            </button>
            <button type = "button" onClick = {() => editor.chain().focus().toggleUnderline().run()} className = "bg-transparent m-0.5">
                <u>U</u>
            </button>
        </div>
    </div>
  )
}

export default ToolbarTool;