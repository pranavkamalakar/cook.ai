import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, Circle, Timer, Pause, Play } from 'lucide-react';
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
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <div className="bg-white border-b border-[#f2ede4]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-stone-600 hover:text-stone-900 transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Cooking</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-stone-900 font-semibold text-base">{recipe.title}</h1>
              <p className="text-stone-400 text-xs mt-0.5">
                Step {currentStepIndex + 1} of {recipe.steps.length}
              </p>
            </div>
            
            <div className="w-20" />
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-stone-100 rounded-full h-1.5 border border-stone-200/30">
              <div
                className="bg-orange-650 rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Step Image & Timer */}
          <div className="order-2 lg:order-1">
            <div className="bg-white border border-[#f2ede4] rounded-xl p-5 shadow-sm h-full flex flex-col justify-between">
              <div>
                {currentStep.image ? (
                  <img
                    src={currentStep.image}
                    alt={`Step ${currentStep.id}`}
                    className="w-full h-60 object-cover rounded-lg mb-4 border border-[#f2ede4]"
                  />
                ) : (
                  <div className="w-full h-60 bg-stone-50 border border-stone-200/50 rounded-lg mb-4 flex items-center justify-center">
                    <Clock className="w-10 h-10 text-stone-300" />
                  </div>
                )}
              </div>
              
              {/* Timer Section */}
              <div className="text-center bg-[#faf8f5] border border-[#f2ede4] rounded-xl p-4 mt-auto">
                <div className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">Step Timer</div>
                <div className="text-3xl font-bold text-stone-900 mb-3 font-mono">
                  {timeRemaining > 0 ? formatTime(timeRemaining) : `${currentStep.duration} min`}
                </div>
                
                <div className="flex justify-center">
                  {timeRemaining === 0 ? (
                    <button
                      onClick={startTimer}
                      className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>Start Timer</span>
                    </button>
                  ) : (
                    <button
                      onClick={toggleTimer}
                      className="flex items-center space-x-1.5 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{timerActive ? 'Pause' : 'Resume'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step Instructions */}
          <div className="order-1 lg:order-2">
            <div className="bg-white border border-[#f2ede4] rounded-xl p-6 shadow-sm h-full flex flex-col justify-between min-h-[350px]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold text-base border border-orange-100">
                    {currentStep.id}
                  </div>
                  
                  <button
                    onClick={toggleStepCompletion}
                    className={`transition-colors duration-200 ${
                      completedSteps.includes(currentStep.id)
                        ? 'text-green-600'
                        : 'text-stone-300 hover:text-stone-500'
                    }`}
                  >
                    {completedSteps.includes(currentStep.id) ? (
                      <CheckCircle className="w-7 h-7" />
                    ) : (
                      <Circle className="w-7 h-7" />
                    )}
                  </button>
                </div>
                
                <p className="text-stone-850 text-base leading-relaxed mb-6 font-medium">
                  {currentStep.instruction}
                </p>
              </div>
              
              <div className="mt-auto">
                <div className="flex items-center space-x-2 text-stone-500 text-sm mb-6 border-t border-[#f2ede4] pt-4">
                  <Clock className="w-4 h-4" />
                  <span>Duration: {currentStep.duration} minutes</span>
                </div>
                
                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevStep}
                    disabled={isFirstStep}
                    className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                      isFirstStep
                        ? 'bg-stone-50 text-stone-300 border-stone-150 cursor-not-allowed'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  
                  <button
                    onClick={nextStep}
                    disabled={isLastStep}
                    className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                      isLastStep
                        ? 'bg-stone-50 text-stone-300 border-stone-150 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white border-transparent shadow-sm'
                    }`}
                  >
                    <span>{isLastStep ? 'Complete' : 'Next Step'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Navigation Pills */}
        <div className="bg-white border border-[#f2ede4] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-1">
            {recipe.steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(index)}
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                  index === currentStepIndex
                    ? 'bg-orange-600 text-white'
                    : completedSteps.includes(step.id)
                    ? 'bg-green-500 text-white'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/55'
                }`}
              >
                {completedSteps.includes(step.id) ? (
                  <CheckCircle className="w-4 h-4" />
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