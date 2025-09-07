export interface MaintenanceTask {
    item: string;
    action: string;
    notes?: string;
}

export interface ScheduleInterval {
    title: string;
    subtitle: string;
    tasks: MaintenanceTask[];
}

export type MaintenanceSchedule = ScheduleInterval[];

export const maintenanceSchedules: Record<string, MaintenanceSchedule> = {
    'Suzuki GD 110s': [
        {
            title: 'First Service',
            subtitle: 'At 1,000 KM or 1 Month',
            tasks: [
                { item: 'Engine Oil', action: 'Replace' },
                { item: 'Oil Filter', action: 'Clean' },
                { item: 'Air Filter', action: 'Clean' },
                { item: 'Spark Plug', action: 'Clean & Adjust Gap' },
                { item: 'Tappet Clearance', action: 'Inspect & Adjust' },
                { item: 'Drive Chain', action: 'Clean, Lubricate & Adjust Slack' },
                { item: 'Brakes', action: 'Inspect & Adjust' },
                { item: 'Clutch', action: 'Inspect & Adjust Free Play' },
                { item: 'Nuts & Bolts', action: 'Inspect & Tighten Chassis Bolts' },
            ]
        },
        {
            title: 'Regular Service',
            subtitle: 'Every 2,500 - 3,000 KM or 3 Months',
            tasks: [
                { item: 'Engine Oil', action: 'Replace' },
                { item: 'Air Filter', action: 'Clean (Replace if necessary)' },
                { item: 'Drive Chain', action: 'Clean, Lubricate & Adjust Slack' },
                { item: 'Brakes', action: 'Inspect & Adjust' },
                { item: 'Battery', action: 'Check Electrolyte Level' },
                { item: 'Tire Pressure', action: 'Check & Inflate' },
            ]
        },
        {
            title: 'Periodic Major Service',
            subtitle: 'Every 5,000 - 6,000 KM or 6 Months',
            tasks: [
                { item: 'All Regular Service Tasks', action: 'Perform' },
                { item: 'Oil Filter', action: 'Replace' },
                { item: 'Spark Plug', action: 'Replace' },
                { item: 'Tappet Clearance', action: 'Inspect & Adjust' },
                { item: 'Carburetor', action: 'Clean & Tune' },
                { item: 'Wheel Bearings', action: 'Inspect' },
            ]
        }
    ],
    'Honda CG-125': [
        {
            title: 'First Service',
            subtitle: 'At 1,000 KM or 1 Month',
            tasks: [
                { item: 'Engine Oil', action: 'Replace' },
                { item: 'Centrifugal Oil Filter', action: 'Clean' },
                { item: 'Tappet Clearance', action: 'Inspect & Adjust' },
                { item: 'Spark Plug', action: 'Clean & Adjust' },
                { item: 'Drive Chain', action: 'Clean, Lubricate & Adjust' },
                { item: 'Brakes', action: 'Inspect & Adjust' },
                { item: 'Clutch', action: 'Adjust Free Play' },
                { item: 'Nuts & Bolts', action: 'Inspect & Tighten' },
            ]
        },
        {
            title: 'Regular Service',
            subtitle: 'Every 2,000 KM or 2 Months',
            tasks: [
                { item: 'Engine Oil', action: 'Replace' },
                { item: 'Air Filter', action: 'Clean' },
                { item: 'Drive Chain', action: 'Clean, Lubricate & Adjust' },
                { item: 'Brakes', action: 'Inspect & Adjust' },
                { item: 'Tire Pressure', action: 'Check & Inflate' },
            ]
        },
        {
            title: 'Periodic Major Service',
            subtitle: 'Every 4,000 KM or 4 Months',
            tasks: [
                { item: 'All Regular Service Tasks', action: 'Perform' },
                { item: 'Tappet Clearance', action: 'Inspect & Adjust' },
                { item: 'Spark Plug', action: 'Clean or Replace' },
                { item: 'Centrifugal Oil Filter', action: 'Clean' },
                { item: 'Fuel Strainer Screen', action: 'Clean' },
            ]
        }
    ],
    'DEFAULT': [
        {
            title: 'General Motorcycle Guide',
            subtitle: 'A basic checklist for any motorcycle.',
            tasks: [
                { item: 'Engine Oil', action: 'Replace every 1,500 - 3,000 KM.' },
                { item: 'Drive Chain', action: 'Clean and lubricate every 500 - 800 KM.' },
                { item: 'Brakes', action: 'Check fluid level and pad wear monthly.' },
                { item: 'Tires', action: 'Check pressure weekly and inspect for wear.' },
                { item: 'Air Filter', action: 'Clean or replace every 4,000 - 6,000 KM.' },
                { item: 'Spark Plug', action: 'Inspect or replace every 8,000 - 10,000 KM.' },
            ]
        }
    ],
};
