/**
 * Onboarding tour configurations for user-facing pages
 */

import { TourStep } from "@/components/onboarding/OnboardingTour"

export const profileTourSteps: TourStep[] = [
  {
    target: '[data-tour="profile-header"]',
    title: "Welcome to Your Profile!",
    description: "This is your personal profile page where you can manage all your account information, view your orders, and track your activity.",
    position: "bottom"
  },
  {
    target: '[data-tour="profile-tabs"]',
    title: "Profile Sections",
    description: "Navigate between different sections: Personal Info, Addresses, Orders, Security settings, and more. Each tab gives you control over different aspects of your account.",
    position: "bottom"
  },
  {
    target: '[data-tour="edit-profile"]',
    title: "Edit Your Information",
    description: "Click here to update your personal details like name, email, phone number, and profile picture anytime.",
    position: "left"
  },
  {
    target: '[data-tour="wallet-balance"]',
    title: "Your Wallet",
    description: "Keep track of your Go-Shop wallet balance. You can use this for quick checkouts and receive refunds directly to your wallet.",
    position: "bottom"
  },
  {
    target: '[data-tour="recent-orders"]',
    title: "Recent Orders",
    description: "View your recent orders here. Click on any order to see full details, track delivery, or contact support.",
    position: "top"
  }
]

export const walletTourSteps: TourStep[] = [
  {
    target: '[data-tour="wallet-balance-card"]',
    title: "Your Wallet Balance",
    description: "This shows your current wallet balance. You can use this balance for purchases or withdraw it to your bank account.",
    position: "bottom"
  },
  {
    target: '[data-tour="add-funds-btn"]',
    title: "Add Funds",
    description: "Click here to add money to your wallet using Mobile Money, Card, or Bank Transfer. Funds are added instantly!",
    position: "bottom"
  },
  {
    target: '[data-tour="withdraw-btn"]',
    title: "Withdraw Funds",
    description: "Need to cash out? Click here to withdraw your wallet balance to your bank account or mobile money.",
    position: "bottom"
  },
  {
    target: '[data-tour="transaction-history"]',
    title: "Transaction History",
    description: "View all your wallet transactions here - deposits, withdrawals, purchases, and refunds. Filter by date or type to find specific transactions.",
    position: "top"
  },
  {
    target: '[data-tour="quick-actions"]',
    title: "Quick Actions",
    description: "Use these shortcuts for common wallet actions like sending money to friends, paying bills, or buying gift cards.",
    position: "left"
  }
]

export const messagesTourSteps: TourStep[] = [
  {
    target: '[data-tour="conversations-list"]',
    title: "Your Conversations",
    description: "All your conversations with sellers and support are listed here. Click on any conversation to view and reply to messages.",
    position: "right"
  },
  {
    target: '[data-tour="search-conversations"]',
    title: "Search Conversations",
    description: "Looking for a specific conversation? Use the search bar to quickly find chats by seller name or topic.",
    position: "bottom"
  },
  {
    target: '[data-tour="chat-area"]',
    title: "Chat Window",
    description: "This is where your conversation appears. You can see message history and send new messages here.",
    position: "left"
  },
  {
    target: '[data-tour="quick-actions-btn"]',
    title: "Quick Actions",
    description: "Click here to access quick message templates for common questions like order inquiries, product questions, or payment issues.",
    position: "top"
  },
  {
    target: '[data-tour="message-input"]',
    title: "Send Messages",
    description: "Type your message here. You can reference orders using #OrderNumber or mention products by name for better support.",
    position: "top"
  },
  {
    target: '[data-tour="auto-response-info"]',
    title: "Instant Help",
    description: "When you send a message, you'll get an instant automated response with helpful information while waiting for a support agent.",
    position: "top"
  }
]
