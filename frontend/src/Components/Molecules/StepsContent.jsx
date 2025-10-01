import React from 'react';

export default function StepsContent({ active }) {
    return (
        <div className="mt-8 rounded-lg bg-slate-50 p-8 text-black dark:text-white shadow dark:bg-gray-900">
            <p className="text-xl">StepsContent</p>
            <p>Now showing content for step number {active}</p>
        </div>
    );
}
