import React, { useState } from 'react';
import type { ProjectData } from '..';

interface Props {
    setStep: (step: string) => void;
    allProjects: ProjectData[];
    loadProject: (project: ProjectData) => void;
}

const Calendar: React.FC<Props> = ({ setStep, allProjects, loadProject }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysOfWeek = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'];

    const changeMonth = (delta: number) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Monday is 0, Sunday is 6
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const calendarDays = [];
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            
            const projectsForDay = allProjects.filter(p => {
                if (!p.startDate) return false;
                const startDate = new Date(p.startDate);
                const endDate = p.endDate ? new Date(p.endDate) : startDate;
                const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                return current >= start && current <= end;
            });

            calendarDays.push(
                <div key={day} className="calendar-day">
                    <span className="day-number">{day}</span>
                    <div className="projects-container">
                        {projectsForDay.map(p => (
                            <div 
                                key={p.id} 
                                className="calendar-project"
                                onClick={() => loadProject(p)}
                                title={`Odpri projekt: ${p.client?.name || p.id}`}
                            >
                                {p.client?.name || `Projekt #${p.id.slice(-4)}`}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return calendarDays;
    };

    return (
        <div className="card">
            <h2>Koledar Projektov</h2>
            <div className="calendar-header">
                <button onClick={() => changeMonth(-1)}>&lt; Prejšnji</button>
                <h3>{currentDate.toLocaleString('sl-SI', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)}>Naslednji &gt;</button>
            </div>
            <div className="calendar-grid">
                {daysOfWeek.map(day => <div key={day} className="calendar-day-header">{day}</div>)}
                {renderCalendar()}
            </div>
            <button onClick={() => setStep("home")} className="btn-secondary" style={{marginTop: '20px'}}>Nazaj</button>
        </div>
    );
};

export default Calendar;
