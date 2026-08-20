"use client";
import { Loader_ } from "..";
interface LoaderProps {
  isLoading?: boolean;
}

const Loader = ({ isLoading = true }: LoaderProps) => {
  return (
    <>
      {isLoading && (
        <div className="loader-indicator">
          <Loader_ />
        </div>
      )}
    </>
  );
};

export default Loader;
