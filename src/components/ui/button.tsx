type ButtonSize = "sm" | "md";

type ButtonProps = {
  children: string;
  size?: ButtonSize;
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "max-w-[350px]",
  md: "max-w-[500px]",
};

export const Button = ({ children, size = "sm" }: ButtonProps) => {
  return (
    <button
      type="button"
      className={`
        w-full
        ${sizeClassMap[size]}
        bg-[linear-gradient(90deg,#2C3A4F_0%,#000000_30%,#000000_65%,#2C3A4F_100%)] 
        border border-[#656565] 
        block
        py-5
        cursor-pointer 
        text-white
        font-semibold
        `}
    >
      {children}
    </button>
  );
};
