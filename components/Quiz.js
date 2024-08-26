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

  const calculateIQScore = (correctAnswers, totalQuestions) => {
    const rawScore = (correctAnswers / totalQuestions) * 100;
    const iqScore = (rawScore / 100) * 40 + 80;
    return Math.round(iqScore);
  };

  const handleOptionClick = (index) => {
    if (index === questions[currentQuestion]?.correctAnswerIndex) {
      setCorrectAnswers(correctAnswers + 1);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleRestartClick = () => {
    setCurrentQuestion(0);
    setCorrectAnswers(0);
    setShowResult(false);
  };

  const handleFinalSubmitClick = () => {
    setShowResult(true);
  };

  const renderPaginationButtons = () => {
    const totalButtons = questions.length;
    const maxVisibleButtons = 10;
    const buttons = [];

    let start, end;
    if (currentQuestion < 9) {
      start = 1;
      end = Math.min(18, totalButtons);
    } else if (currentQuestion >= 11 && currentQuestion < 15) {
      start = 7;
      end = Math.min(23, totalButtons);
    } else {
      start = 15;
      end = Math.min(30, totalButtons);
    }

    if (start > 1) {
      buttons.push(
        <button
          key={1}
          className={`w-10 h-10 flex items-center justify-center font-semibold rounded-full shadow-lg transition-colors ${
            currentQuestion === 0
              ? "bg-blue-500 text-white"
              : "bg-white text-blue-500"
          } hover:bg-blue-600 hover:text-white`}
          onClick={() => setCurrentQuestion(0)}
        >
          1
        </button>
      );

      if (start > 2) {
        buttons.push(
          <span
            key="start-ellipsis"
            className="w-10 h-10 flex items-center justify-center"
          >
            ...
          </span>
        );
      }
    }

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

    if (end < totalButtons) {
      if (end < totalButtons - 1) {
        buttons.push(
          <span
            key="end-ellipsis"
            className="w-10 h-10 flex items-center justify-center"
          >
            ...
          </span>
        );
      }

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
    const iqScore = calculateIQScore(correctAnswers, questions.length);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
        <h1 className="text-4xl font-bold mb-6">
          You got {correctAnswers} out of {questions.length} correct!
        </h1>
        <p className="text-2xl mb-6">Your IQ Score is {iqScore}</p>
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
          {currentQuestion === questions.length - 1 ? (
            <button
              className="w-24 h-10 flex items-center justify-center font-semibold rounded-full shadow-lg bg-green-500 text-white hover:bg-green-600"
              onClick={handleFinalSubmitClick}
            >
              Submit
            </button>
          ) : (
            <button
              className="w-10 h-10 flex items-center justify-center font-semibold rounded-full shadow-lg bg-white text-blue-500 hover:bg-blue-600 hover:text-white"
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={currentQuestion === questions.length - 1}
            >
              &gt;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
