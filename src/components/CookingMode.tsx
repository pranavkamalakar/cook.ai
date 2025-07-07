import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, Clock, CheckCircle, Circle, Timer, Pause, Play } from 'lucide-react';
import { Recipe } from '../types/Recipe';

interface CookingModeProps {
  recipe: Recipe;
  onBack: () => void;
}

const CookingMode: React.FC<CookingModeProps> = ({ recipe, onBack }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const currentStep = recipe.steps[currentStepIndex];
  const isLastStep = currentStepIndex === recipe.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const nextStep = () => {
    if (!isLastStep) {
      setCurrentStepIndex(currentStepIndex + 1);
      setTimerActive(false);
      setTimeRemaining(0);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
      setTimerActive(false);
      setTimeRemaining(0);
    }
  };

  const toggleStepCompletion = () => {
    const stepId = currentStep.id;
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter(id => id !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const startTimer = () => {
    setTimeRemaining(currentStep.duration * 60); // Convert minutes to seconds
    setTimerActive(true);
  };

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((currentStepIndex + 1) / recipe.steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-accent-500 to-food-500">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Exit Cooking</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-white font-semibold text-lg">{recipe.title}</h1>
              <p className="text-white/70 text-sm">
                Step {currentStepIndex + 1} of {recipe.steps.length}
              </p>
            </div>
            
            <div className="w-20" />
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Step Image */}
          <div className="order-2 lg:order-1">
            <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 border border-white/30 h-full">
              {currentStep.image ? (
                <img
                  src={currentStep.image}
                  alt={`Step ${currentStep.id}`}
                  className="w-full h-64 object-cover rounded-2xl mb-4"
                />
              ) : (
                <div className="w-full h-64 bg-white/10 rounded-2xl mb-4 flex items-center justify-center">
                  <Clock className="w-12 h-12 text-white/50" />
                </div>
              )}
              
              {/* Timer Section */}
              <div className="text-center">
                <div className="text-white/80 text-sm mb-2">Step Duration</div>
                <div className="text-2xl font-bold text-white mb-4">
                  {timeRemaining > 0 ? formatTime(timeRemaining) : `${currentStep.duration} min`}
                </div>
                
                <div className="flex justify-center space-x-3">
                  {timeRemaining === 0 ? (
                    <button
                      onClick={startTimer}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all"
                    >
                      <Timer className="w-4 h-4" />
                      <span>Start Timer</span>
                    </button>
                  ) : (
                    <button
                      onClick={toggleTimer}
                      className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all"
                    >
                      {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{timerActive ? 'Pause' : 'Resume'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step Instructions */}
          <div className="order-1 lg:order-2">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 border border-white/30 h-full flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                  {currentStep.id}
                </div>
                
                <button
                  onClick={toggleStepCompletion}
                  className={`transition-all duration-200 ${
                    completedSteps.includes(currentStep.id)
                      ? 'text-green-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {completedSteps.includes(currentStep.id) ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <Circle className="w-8 h-8" />
                  )}
                </button>
              </div>
              
              <div className="flex-1">
                <p className="text-gray-800 text-lg leading-relaxed mb-6">
                  {currentStep.instruction}
                </p>
                
                <div className="flex items-center space-x-2 text-gray-600 mb-8">
                  <Clock className="w-4 h-4" />
                  <span>{currentStep.duration} minutes</span>
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={prevStep}
                  disabled={isFirstStep}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all ${
                    isFirstStep
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                <button
                  onClick={nextStep}
                  disabled={isLastStep}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all ${
                    isLastStep
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-accent-500 hover:shadow-lg text-white transform hover:scale-105'
                  }`}
                >
                  <span>{isLastStep ? 'Complete' : 'Next Step'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step Navigation Pills */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-2">
            {recipe.steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(index)}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                  index === currentStepIndex
                    ? 'bg-white text-primary-600'
                    : completedSteps.includes(step.id)
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {completedSteps.includes(step.id) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingMode;