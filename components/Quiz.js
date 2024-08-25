"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Navbar from "./Navbar";

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Fetch the questions data from the public directory
    fetch("/question.json")
      .then((response) => response.json())
      .then((data) => setQuestions(data))
      .catch((error) => console.error("Error loading questions:", error));
  }, []);

  const handleOptionClick = (index) => {
    if (index === questions[currentQuestion]?.correctAnswerIndex) {
      setCorrectAnswers(correctAnswers + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleRestartClick = () => {
    setCurrentQuestion(0);
    setCorrectAnswers(0);
    setShowResult(false);
  };

  const renderPaginationButtons = () => {
    const totalButtons = questions.length;
    const maxVisibleButtons = 5;
    const buttons = [];

    const start = 1;
    const end = totalButtons <= 20 ? totalButtons : 20;
    const currentDisplayRangeStart = Math.max(1, currentQuestion + 1 - Math.floor(maxVisibleButtons / 2));
    const currentDisplayRangeEnd = Math.min(20, currentDisplayRangeStart + maxVisibleButtons - 1);

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          className={`w-10 h-10 flex items-center justify-center font-semibold rounded-full shadow-lg transition-colors ${
            currentQuestion + 1 === i
              ? "bg-blue-500 text-white"
              : "bg-white text-blue-500"
          } hover:bg-blue-600 hover:text-white`}
          onClick={() => setCurrentQuestion(i - 1)}
        >
          {i}
        </button>
      );
    }

    if (totalButtons > 20) {
      buttons.push(
        <span key="end-ellipsis" className="w-10 h-10 flex items-center justify-center">
          ...
        </span>
      );

      buttons.push(
        <button
          key={totalButtons}
          className={`w-10 h-10 flex items-center justify-center font-semibold rounded-full shadow-lg transition-colors ${
            currentQuestion + 1 === totalButtons
              ? "bg-blue-500 text-white"
              : "bg-white text-blue-500"
          } hover:bg-blue-600 hover:text-white`}
          onClick={() => setCurrentQuestion(totalButtons - 1)}
        >
          {totalButtons}
        </button>
      );
    }

    return buttons;
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading...
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
        <h1 className="text-4xl font-bold mb-6">
          You got {correctAnswers} out of {questions.length} correct!
        </h1>
        <button
          className="bg-white text-blue-500 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100"
          onClick={handleRestartClick}
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col">
      <Navbar />
      <div className="flex space-x-8 h-screen items-center justify-center">
        <div className="mb-12 p-1 mr-20 bg-white rounded-2xl shadow-lg">
          <Image
            priority
            src={questions[currentQuestion]?.question}
            alt="Question"
            width={500}
            height={500}
            className="rounded-lg"
          />
        </div>
        <div className="grid grid-cols-2 gap-6 mb-12">
          <p className="absolute top-[170px] right-80">Choose your answers:</p>
          {questions[currentQuestion]?.options.map((option, index) => (
            <button
              key={index}
              className="p-4 border-4 border-transparent rounded-lg hover:bg-blue-200 bg-white shadow-lg transform transition-transform hover:scale-105 focus:scale-95"
              onClick={() => handleOptionClick(index)}
            >
              <Image
                priority
                src={option}
                alt={`Option ${index + 1}`}
                width={100}
                height={100}
                className="rounded-lg"
              />
            </button>
          ))}
        </div>
        <div className="flex mb-20 items-center space-x-2 absolute bottom-10">
          <button
            className="w-10 h-10 flex items-center justify-center font-semibold rounded-full shadow-lg bg-white text-blue-500 hover:bg-blue-600 hover:text-white"
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
          >
            &lt;
          </button>
          {renderPaginationButtons()}
          <button
            className="w-10 h-10 flex items-center justify-center font-semibold rounded-full shadow-lg bg-white text-blue-500 hover:bg-blue-600 hover:text-white"
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            disabled={currentQuestion === questions.length - 1}
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
