import {
  createElement,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";

type ButtonSize = "sm" | "md";

type ButtonOwnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  size?: ButtonSize;
  className?: string;
};

type ButtonProps<T extends ElementType> = ButtonOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ButtonOwnProps<T>>;

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "max-w-[350px]",
  md: "max-w-[500px]",
};

export const Button = <T extends ElementType = "button">(
  props: ButtonProps<T>,
) => {
  const { as, children, size = "sm", className, ...restProps } = props;

  const Component = as ?? "button";

  const baseClassName = `
    w-full
    ${sizeClassMap[size]}
    bg-[linear-gradient(90deg,#2C3A4F_0%,#000000_30%,#000000_65%,#2C3A4F_100%)]
    border border-[#656565]
    block
    py-5
    cursor-pointer
    text-white
    font-semibold
    text-center
  `;

  const mergedClassName = [baseClassName, className].filter(Boolean).join(" ");
  const defaultProps =
    Component === "button" ? { type: "button" as const } : {};

  if (Component === "button") {
    const buttonProps = restProps as ComponentPropsWithoutRef<"button">;
    return (
      <button
        type={buttonProps.type ?? "button"}
        {...buttonProps}
        className={mergedClassName}
      >
        {children}
      </button>
    );
  }

  return createElement(
    Component,
    {
      ...defaultProps,
      ...(restProps as object),
      className: mergedClassName,
    },
    children,
  );
};
