import { useState } from "react";

function ChatBar({submit, disabled}: {submit: any, disabled: boolean}) {
    

    const [value, setValue] = useState("");
    const empty = !value.trim();


    const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            if (!empty && !disabled) {
                submit(value.trim());
                setValue("");
            }
        }
    };
    return (
        <form onSubmit={(event) => {event.preventDefault(); event.stopPropagation(); submit(value.trim()); setValue("");}} className="px-4 pb-5 pt-2 sm:px-9">
        <div className="mx-auto flex max-w-[820px] items-end gap-2 rounded-[22px] border border-zinc-200 bg-white py-2 pl-5 pr-2 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15">
            <textarea
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about your sources…"
            aria-label="Message"
            className="max-h-44 flex-1 resize-none bg-transparent py-2 text-[15px] leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 [field-sizing:content]"
            />
            <button
                type="submit"
                disabled={empty || disabled}
                aria-label="Send message"
                className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-indigo-500 text-white transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800 disabled:pointer-events-none disabled:opacity-35"
            >
                <svg width="18" height="18" viewBox="0 0 20 20" className="block h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 16V4M4.5 9.5L10 4l5.5 5.5" />
            </svg>
            </button>
            </div>
        <p className="mx-auto mt-1.5 max-w-[820px] pl-5 text-xs text-zinc-400">
            Enter to send · Shift+Enter for a new line
        </p>
        </form>
    );
}

export default ChatBar;