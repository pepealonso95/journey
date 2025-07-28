import Image from "next/image";
import { X, MessageSquarePlus, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { GoogleBook } from "@/lib/google-books";

interface BookSlotProps {
  book?: GoogleBook;
  index: number;
  onRemove?: (index: number) => void;
  customDescription?: string;
  onDescriptionChange?: (description: string) => void;
}

export function BookSlot({ book, index, onRemove, customDescription, onDescriptionChange }: BookSlotProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(customDescription || "");

  const handleSaveDescription = () => {
    onDescriptionChange?.(tempDescription);
    setIsEditingDescription(false);
  };

  const handleCancelDescription = () => {
    setTempDescription(customDescription || "");
    setIsEditingDescription(false);
  };

  return (
    <div className="relative">
      <div className={cn(
        "relative aspect-[2/3] rounded-md overflow-hidden mb-2",
        book ? "shadow-md" : "bg-gray-100 border-2 border-dashed border-gray-300"
      )}>
        {book ? (
          <>
            {book.volumeInfo.imageLinks?.large || book.volumeInfo.imageLinks?.medium || book.volumeInfo.imageLinks?.thumbnail ? (
              <Image
                src={book.volumeInfo.imageLinks.large || book.volumeInfo.imageLinks.medium || book.volumeInfo.imageLinks.thumbnail || ''}
                alt={book.volumeInfo.title}
                fill
                className="object-cover"
                sizes="120px"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200">
                <span className="text-xs text-gray-500">No cover</span>
              </div>
            )}
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-2xl font-light text-gray-400">{index + 1}</span>
          </div>
        )}
      </div>
      {book ? (
        <div>
          <h3 className="font-medium text-xs line-clamp-2 mb-1 text-gray-900">
            {book.volumeInfo.title}
          </h3>
          {book.volumeInfo.authors && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {book.volumeInfo.authors[0]}
            </p>
          )}
          
          {/* Custom Description Section */}
          {onDescriptionChange && (
            <div className="mt-3">
              {isEditingDescription ? (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Your note</label>
                    <span className="text-xs text-gray-500">
                      {tempDescription.length}/300
                    </span>
                  </div>
                  <textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    placeholder="Why did you choose this book? What makes it special?"
                    className="w-full text-sm p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    rows={4}
                    maxLength={300}
                  />
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
                    <button
                      onClick={handleCancelDescription}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors font-medium order-1 sm:order-2"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {customDescription ? (
                    <div className="group relative p-3 bg-blue-50 rounded-lg border border-blue-100 transition-all hover:border-blue-200">
                      <div className="pr-8">
                        <p className="text-sm text-blue-900 font-medium mb-0.5">Your note</p>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          {customDescription}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEditingDescription(true)}
                        className="absolute top-2 right-2 p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Edit note"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingDescription(true)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all group"
                    >
                      <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-gray-800">
                        <MessageSquarePlus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add a note</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Share why this book matters</p>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xs text-gray-500">Empty</p>
        </div>
      )}
    </div>
  );
}