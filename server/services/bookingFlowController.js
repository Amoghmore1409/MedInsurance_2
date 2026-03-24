/**
 * Appointment Booking Flow Controller
 * Handles the conversation state machine for appointment booking
 * Supports multiple channels: chat, voice, call
 */

import sessionManager from './bookingSessionManager.js';
import { extractIntent } from './intentExtractor.js';
import {
  DEMO_USERS,
  FLOW_TYPES,
  STEPS,
  TIME_SLOTS,
  DIAGNOSTIC_CENTERS,
  checkSlotAvailability,
  getAvailableSlots,
  getUserById,
  getCenterById
} from './bookingMockData.js';

class BookingFlowController {
  /**
   * Start a new booking session
   */
  startSession(userId, channelType = 'chat') {
    // Validate user
    const user = getUserById(userId);
    if (!user) {
      return {
        success: false,
        message: 'Invalid user ID',
        error: 'User not found'
      };
    }

    const sessionId = sessionManager.createSession(userId, channelType);
    const session = sessionManager.getSession(sessionId);

    // Update with user name
    sessionManager.updateSession(sessionId, { userName: user.name });

    // Get entry message
    const response = this.getEntryMessage(session);

    return {
      success: true,
      sessionId,
      userId,
      userName: user.name,
      ...response
    };
  }

  /**
   * Handle user input and return next step
   * Now uses AI intent extraction for natural language understanding
   */
  async handleUserInput(sessionId, userInput) {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: 'Session not found',
        error: 'Invalid session ID'
      };
    }

    const currentStep = session.currentStep;

    // Use AI to extract intent from natural language
    const extractedInput = await extractIntent(userInput, currentStep);

    let response;

    switch (currentStep) {
      case STEPS.ENTRY:
        response = this.handleFlowSelection(session, extractedInput);
        break;

      case STEPS.FLOW_SELECTION:
        response = this.handleFlowSelection(session, extractedInput);
        break;

      case STEPS.CENTER_SELECTION:
        response = this.handleCenterSelection(session, extractedInput);
        break;

      case STEPS.DISTANCE_CONFIRMATION:
        response = this.handleDistanceConfirmation(session, extractedInput);
        break;

      case STEPS.TIME_SELECTION:
        response = this.handleTimeSelection(session, extractedInput);
        break;

      default:
        response = {
          success: false,
          message: 'Invalid step',
          error: 'Unknown step in flow'
        };
    }

    return response;
  }

  /**
   * Handle flow selection (Home vs Diagnostic Center)
   */
  handleFlowSelection(session, userInput) {
    const input = userInput.toString().trim().toLowerCase();
    const userName = session.userName || 'friend';

    if (input === '1' || input === 'one' || input === 'home' || input === 'home visit') {
      // Home Visit selected
      sessionManager.updateSession(session.sessionId, {
        selectedFlow: FLOW_TYPES.HOME,
        currentStep: STEPS.TIME_SELECTION
      });

      return this.getHomeVisitTimeSelection(session);
    } else if (input === '2' || input === 'two' || input === 'center' || input === 'diagnostic' || input === 'diagnostic center') {
      // Diagnostic Center selected
      sessionManager.updateSession(session.sessionId, {
        selectedFlow: FLOW_TYPES.CENTER,
        currentStep: STEPS.CENTER_SELECTION
      });

      return this.getCenterSelection(session);
    } else {
      // Invalid input - ask again with acknowledgment
      return {
        success: true,
        message: `Sorry, I didn't catch that. Please say 1 for Home Visit or 2 for Diagnostic Center.`,
        options: ['1 - Home Visit', '2 - Diagnostic Center Visit'],
        type: 'selection',
        channelType: session.channelType,
        currentStep: STEPS.ENTRY
      };
    }
  }

  /**
   * Handle center selection
   */
  handleCenterSelection(session, userInput) {
    const input = parseInt(userInput.toString().trim());

    if (isNaN(input) || input < 1 || input > 3) {
      // Invalid center number - help user
      return {
        success: true,
        message: `Sorry, I didn't catch that. Please say 1, 2, or 3 for the center you prefer.`,
        options: ['1 - HealthCare', '2 - City Lab', '3 - MedPlus'],
        type: 'selection',
        channelType: session.channelType,
        currentStep: STEPS.CENTER_SELECTION
      };
    }

    const selectedCenter = DIAGNOSTIC_CENTERS[input - 1];

    if (selectedCenter.isFar) {
      // Center is far - need confirmation
      sessionManager.updateSession(session.sessionId, {
        selectedCenter: selectedCenter.id,
        currentStep: STEPS.DISTANCE_CONFIRMATION
      });

      return this.getDistanceConfirmation(session, selectedCenter);
    } else {
      // Center is near - go to time selection
      sessionManager.updateSession(session.sessionId, {
        selectedCenter: selectedCenter.id,
        currentStep: STEPS.TIME_SELECTION
      });

      return this.getDiagnosticCenterTimeSelection(session, selectedCenter);
    }
  }

  /**
   * Handle distance confirmation
   */
  handleDistanceConfirmation(session, userInput) {
    const input = userInput.toString().trim().toLowerCase();

    if (input === 'yes' || input === '1' || input === 'one' || input === 'okay' || input === 'ok') {
      // User wants to proceed
      const center = getCenterById(session.selectedCenter);

      sessionManager.updateSession(session.sessionId, {
        currentStep: STEPS.TIME_SELECTION
      });

      return this.getDiagnosticCenterTimeSelection(session, center);
    } else if (input === 'no' || input === '2' || input === 'two' || input === 'nope') {
      // User wants to select different center
      sessionManager.updateSession(session.sessionId, {
        selectedCenter: null,
        currentStep: STEPS.CENTER_SELECTION
      });

      return this.getCenterSelection(session);
    } else {
      // Invalid input
      const center = getCenterById(session.selectedCenter);
      return {
        success: true,
        message: `Sorry, I didn't catch that. Do you want to continue with ${center.name} or choose a different center? Say yes or no.`,
        options: ['1 - Yes', '2 - No'],
        type: 'selection',
        channelType: session.channelType,
        currentStep: STEPS.DISTANCE_CONFIRMATION
      };
    }
  }

  /**
   * Handle time selection
   */
  handleTimeSelection(session, userInput) {
    const input = parseInt(userInput.toString().trim());
    const availableSlots = getAvailableSlots(TIME_SLOTS, session.selectedFlow);

    // Validate selection is a number
    if (isNaN(input) || input < 1 || input > 3) {
      // Invalid input
      return {
        success: true,
        message: `I didn't quite catch that. Please say 1, 2, or 3 for your preferred time.`,
        options: ['1 - 8:00 AM', '2 - 9:00 AM', '3 - 10:00 AM'],
        type: 'selection',
        channelType: session.channelType,
        currentStep: STEPS.TIME_SELECTION
      };
    }

    const selectedTime = TIME_SLOTS[input - 1];

    // Check if slot is available
    if (!checkSlotAvailability(selectedTime, session.selectedFlow)) {
      // Slot not available - show available slots
      sessionManager.updateSession(session.sessionId, {
        currentStep: STEPS.TIME_SELECTION
      });

      return this.getUnavailableSlotMessage(session);
    }

    // Time is available - confirm booking
    sessionManager.updateSession(session.sessionId, {
      selectedTime: selectedTime,
      currentStep: STEPS.CONFIRMATION
    });

    return this.getConfirmationMessage(session);
  }

  // ============ MESSAGE GENERATION METHODS ============

  /**
   * Entry message - Welcome and flow selection
   */
  getEntryMessage(session) {
    const channelType = session.channelType;
    const userName = session.userName || 'valued customer';

    let message = `Hi ${userName}, welcome to MedInsure!\n\nCongratulations on your new insurance policy. Now we need to schedule your mandatory medical check-up.\n\nWould you prefer a doctor to visit you at home, or would you like to visit one of our diagnostic centers?\n\n1. Home Visit - We'll send a medical professional to your home\n2. Diagnostic Center Visit - Visit one of our partner centers\n\nJust say 1 or 2.`;

    const options = ['1 - Home Visit', '2 - Diagnostic Center Visit'];

    return {
      success: true,
      message,
      options,
      type: 'selection',
      channelType,
      currentStep: STEPS.ENTRY
    };
  }

  /**
   * Home visit time selection
   */
  getHomeVisitTimeSelection(session) {
    const message = `Perfect! I've noted that you prefer a home visit. That's convenient - one of our medical professionals will visit you at your home.\n\nNow, what time works best for you? We have three slots available:\n1. 7 A M\n2. 8 A M\n3. 9 A M\n\nJust tell me your preferred time.`;

    return {
      success: true,
      message,
      options: ['1 - 7:00 AM', '2 - 8:00 AM', '3 - 9:00 AM'],
      type: 'selection',
      channelType: session.channelType,
      currentStep: STEPS.TIME_SELECTION
    };
  }

  /**
   * Diagnostic center selection
   */
  getCenterSelection(session) {
    let message = `Excellent! Let me find the best diagnostic center near you.\n\nWe have 3 centers available:\n`;
    DIAGNOSTIC_CENTERS.forEach((center, index) => {
      message += `${index + 1}. ${center.name} - ${center.distance} away\n`;
    });
    message += `\nWhich center would you prefer? Just say the number.`;

    const options = DIAGNOSTIC_CENTERS.map(
      (center, index) => `${index + 1} - ${center.name} (${center.distance})`
    );

    return {
      success: true,
      message,
      options,
      type: 'selection',
      channelType: session.channelType,
      currentStep: STEPS.CENTER_SELECTION
    };
  }

  /**
   * Distance confirmation for far centers
   */
  getDistanceConfirmation(session, center) {
    const message = `I see you've selected ${center.name}. Just a heads up - it's about ${center.distance} from your location. Is that okay with you, or would you like to choose a closer center?\n\nSay yes to continue with this center, or no to see other options.`;

    return {
      success: true,
      message,
      options: ['1 - Yes, continue', '2 - No, choose another'],
      type: 'selection',
      channelType: session.channelType,
      currentStep: STEPS.DISTANCE_CONFIRMATION
    };
  }

  /**
   * Diagnostic center time selection
   */
  getDiagnosticCenterTimeSelection(session, center) {
    const centerName = center.name;
    const message = `Great! I've confirmed your appointment at ${centerName}.\n\nNow let's pick a time that works for you. We have these slots available:\n1. 7 A M\n2. 8 A M\n3. 9 A M\n\nWhich time is best for you?`;

    return {
      success: true,
      message,
      options: ['1 - 7:00 AM', '2 - 8:00 AM', '3 - 9:00 AM'],
      type: 'selection',
      channelType: session.channelType,
      currentStep: STEPS.TIME_SELECTION
    };
  }

  /**
   * Unavailable slot message
   */
  getUnavailableSlotMessage(session) {
    const availableSlots = getAvailableSlots(TIME_SLOTS, session.selectedFlow);
    let message = `I'm sorry, but 7 AM is not available right now.`;

    if (session.selectedFlow === FLOW_TYPES.HOME) {
      message += ` For home visits, we have these times available:\n`;
    } else {
      const center = getCenterById(session.selectedCenter);
      message += ` At ${center.name}, we have these times available:\n`;
    }

    availableSlots.forEach((slot, index) => {
      const slotIndex = TIME_SLOTS.indexOf(slot) + 1;
      message += `${slotIndex}. ${slot}\n`;
    });

    message += `\nWhich of these times works better for you?`;

    const slotOptions = availableSlots.map(
      slot => `${TIME_SLOTS.indexOf(slot) + 1} - ${slot}`
    );

    return {
      success: true,
      message,
      options: slotOptions,
      type: 'selection',
      channelType: session.channelType,
      currentStep: STEPS.TIME_SELECTION
    };
  }

  /**
   * Time selection message (generic)
   */
  getTimeSelectionMessage(session) {
    if (session.selectedFlow === FLOW_TYPES.HOME) {
      return this.getHomeVisitTimeSelection(session);
    } else {
      const center = getCenterById(session.selectedCenter);
      return this.getDiagnosticCenterTimeSelection(session, center);
    }
  }

  /**
   * Invalid input retry message
   */
  getInvalidInputMessage(session) {
    const currentStep = session.currentStep;

    if (currentStep === STEPS.TIME_SELECTION) {
      return {
        success: true,
        message: `I didn't catch that. Please say 1 for 8 AM, 2 for 9 AM, or 3 for 10 AM.`,
        options: ['1 - 8:00 AM', '2 - 9:00 AM', '3 - 10:00 AM'],
        type: 'selection',
        channelType: session.channelType,
        currentStep: STEPS.TIME_SELECTION
      };
    } else if (currentStep === STEPS.CENTER_SELECTION) {
      return this.getCenterSelection(session);
    } else if (currentStep === STEPS.DISTANCE_CONFIRMATION) {
      const center = getCenterById(session.selectedCenter);
      return this.getDistanceConfirmation(session, center);
    }

    return this.getEntryMessage(session);
  }

  /**
   * Confirmation message - Booking confirmed
   */
  getConfirmationMessage(session) {
    let message = `Perfect! Your medical appointment is all set.`;

    if (session.selectedFlow === FLOW_TYPES.HOME) {
      message += ` A medical professional will visit you at your home tomorrow at ${session.selectedTime}.`;
    } else {
      const center = getCenterById(session.selectedCenter);
      message += ` Your appointment is confirmed at ${center.name} tomorrow at ${session.selectedTime}.`;
    }

    message += `\n\nHere are some important instructions:\n`;
    message += `- Please come or be present for a fasting blood test if required.\n`;
    message += `- Keep your ID proof and insurance policy card ready.\n`;

    if (session.selectedFlow === FLOW_TYPES.HOME) {
      message += `- Our medical professional will call you 30 minutes before arrival.\n`;
    } else {
      const center = getCenterById(session.selectedCenter);
      message += `- Location: ${center.address}\n`;
      message += `- Please arrive 10 minutes early.\n`;
    }

    message += `\nThank you for choosing MedInsure. We're committed to your health!`;

    sessionManager.updateSession(session.sessionId, {
      currentStep: STEPS.COMPLETED
    });

    return {
      success: true,
      message,
      options: [],
      type: 'confirmation',
      channelType: session.channelType,
      currentStep: STEPS.CONFIRMATION,
      bookingDetails: {
        flow: session.selectedFlow,
        center: session.selectedFlow === FLOW_TYPES.CENTER ? session.selectedCenter : null,
        time: session.selectedTime,
        user: session.userName
      }
    };
  }

  /**
   * Get session details
   */
  getSessionDetails(sessionId) {
    return sessionManager.getSession(sessionId);
  }
}

export default new BookingFlowController();
