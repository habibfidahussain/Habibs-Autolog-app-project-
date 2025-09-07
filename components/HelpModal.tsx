import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
             <h2 className="text-2xl font-bold text-white">Help & Features</h2>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-600" aria-label="Close help modal">
                 <CloseIcon />
            </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <p className="text-gray-300">
                Welcome! This is your digital logbook for tracking all maintenance, fuel, and expenses for your vehicles. Here’s a quick guide to its features.
            </p>

            <HelpSection title="Managing Your Vehicles">
                <p>Add, edit, and switch between multiple vehicles seamlessly.</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong className="text-indigo-300">Add/Edit:</strong> Use the "Manage Vehicles" button in the header to add a new vehicle or edit details like its name, year, and engine size.</li>
                    <li><strong className="text-indigo-300">Switch:</strong> Use the dropdown menu in the header to switch between your saved vehicles. All data is saved per vehicle.</li>
                </ul>
            </HelpSection>

            <HelpSection title="Logging Entries">
                <p>Keep a detailed history of every service and fill-up.</p>
                 <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong className="text-indigo-300">Add Entry:</strong> Click the green "Add Entry" button to open the form.</li>
                    <li><strong className="text-indigo-300">Details:</strong> You can log the date, odometer reading, category (Oil, Parts, Fuel, etc.), a description, and the cost. For fuel entries, you can also add the number of liters.</li>
                    <li><strong className="text-indigo-300">Search & Filter:</strong> On the "History" page, you can search your records or filter by category to quickly find what you're looking for.</li>
                </ul>
            </HelpSection>

            <HelpSection title="AI Features">
                <p>Use your camera to speed up data entry and identify parts.</p>
                 <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong className="text-indigo-300">Refuel (Scan Fuel Pump):</strong> Click the "Refuel" button in the header for the quickest way to log fuel. Take a clear photo of the pump display after refueling, and the AI will automatically read the total cost and liters, pre-filling a new fuel log for you to confirm and save.</li>
                    <li><strong className="text-indigo-300">AI Part Identifier:</strong> Found under the "AI Tools" menu. Take a clear, well-lit photo of a single vehicle part. The AI will analyze the image and provide a description of the part, its function, and common signs of wear.</li>
                    <li><strong className="text-indigo-300">AI Sort:</strong> When adding an entry with a long description (e.g., from a receipt), type it all in the description box and click "AI Sort". The AI will automatically split it into separate, categorized entries with their costs.</li>
                </ul>
            </HelpSection>

            <HelpSection title="Recurring Tasks">
                <p>Never forget a service again. The app can automatically schedule future tasks for you.</p>
                 <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong className="text-indigo-300">Set up:</strong> When adding an entry (like an "Oil Change"), check the "Make this a recurring task" box.</li>
                    <li><strong className="text-indigo-300">Intervals:</strong> Set a recurrence interval based on days (e.g., every 90 days) and/or kilometers (e.g., every 1500 km).</li>
                    <li><strong className="text-indigo-300">Auto-Scheduling:</strong> When you save the entry, the app logs the current task as complete and automatically creates a "Scheduled" task for the next due date/odometer reading.</li>
                     <li><strong className="text-indigo-300">Log Scheduled Task:</strong> Scheduled tasks appear on your "Status" and "History" pages. When you perform the service, click "Log Task", confirm the details, and the app will schedule the next one.</li>
                </ul>
            </HelpSection>

            <HelpSection title="Status Dashboard">
                <p>Your at-a-glance view of what needs attention.</p>
                 <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong className="text-indigo-300">Upcoming Tasks:</strong> This page shows all your scheduled tasks and other maintenance items based on your set intervals.</li>
                    <li><strong className="text-indigo-300">Alerts:</strong> Items are flagged as "Overdue", "Due Soon", or "OK" to help you prioritize.</li>
                    <li><strong className="text-indigo-300">Current Odometer:</strong> You can update your vehicle's current odometer on this page to get the most accurate status checks.</li>
                </ul>
            </HelpSection>

            <HelpSection title="Data & Analysis">
                <p>Understand your vehicle's running costs and performance.</p>
                 <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong className="text-indigo-300">Summary Page:</strong> See a full breakdown of your expenses by category and key metrics like cost per kilometer and average fuel economy.</li>
                    <li><strong className="text-indigo-300">Analysis Page:</strong> For fuel logs, this page provides a chart showing your fuel costs over time and other helpful stats.</li>
                    <li><strong className="text-indigo-300">Export to CSV:</strong> From the "History" page, you can export your maintenance and fuel logs to CSV files for use in spreadsheets.</li>
                </ul>
            </HelpSection>

            <HelpSection title="Settings & Customization">
                <p>Tailor the app to your specific needs.</p>
                 <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong className="text-indigo-300">Vehicle Settings (Gear Icon):</strong> Customize the service intervals (in km) for oil changes, tuning, etc., for each specific vehicle.</li>
                    <li><strong className="text-indigo-300">App Settings (Globe Icon):</strong>
                        <ul>
                            <li>- Set custom exchange rates for USD and EUR if you use multiple currencies.</li>
                            <li>- Use the **Backup & Restore** feature to save all your app data to a single file or restore it on a new device.</li>
                        </ul>
                    </li>
                </ul>
            </HelpSection>
        </div>
         <div className="p-4 bg-gray-700/50 text-right">
             <button onClick={onClose} className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold text-white transition-colors">
                 Got it!
            </button>
        </div>
      </div>
      {/* Background click handler */}
      <div className="absolute inset-0 z-[-1]" onClick={onClose}></div>
    </div>
  );
};

interface HelpSectionProps {
    title: string;
    children: React.ReactNode;
}

const HelpSection: React.FC<HelpSectionProps> = ({ title, children }) => (
    <div className="border-l-4 border-indigo-500 pl-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="text-sm text-gray-300 mt-1">{children}</div>
    </div>
);


const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);