import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export function PasswordInput({
    value,
    onChange,
    placeholder,
    inputClassName = "",
    wrapperClassName = "",
    leftIcon,
    required = false,
    autoComplete = "current-password",
    name,
    id,
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={`relative group ${wrapperClassName}`.trim()}>
            {leftIcon}
            <input
                type={visible ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoComplete={autoComplete}
                name={name}
                id={id}
                className={inputClassName}
            />
            <button
                type="button"
                onClick={() => setVisible((current) => !current)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 text-lg hover:text-slate-700 transition-colors"
                aria-label={visible ? "Hide password" : "Show password"}
                title={visible ? "Hide password" : "Show password"}
            >
                {visible ? <FiEyeOff /> : <FiEye />}
            </button>
        </div>
    );
}
