"use client";

import { useEffect, useRef, useState } from 'react';

import { Modal, Button } from '@/components';

interface SessionModalProps {
    show: boolean;
    onClick(): void;
    handleEnd: () => void;
}

const SessionModal = ({ show, onClick, handleEnd }: SessionModalProps) => {
    const [countdown, setCountdown] = useState<number>(30);
    const timerId = useRef<NodeJS.Timeout | undefined>(undefined);

    const stayLoggedIn = () => {
        onClick();
        setCountdown(30);
    }

    useEffect(() => {
        if (show) {
            timerId.current = setInterval(() => {
                setCountdown(countdown - 1);
            }, 1000)
        }

        if (countdown <= 0) {
            handleEnd();
            setCountdown(30);
        }
        return () => clearInterval(timerId.current);
    }, [countdown, handleEnd, show]);

    return (
        <Modal show={show}>
            <div className='session-modal'>
                <h1 className='sm-text'>You will automatically logout in:</h1>
                <h1 className='timer-text'>{countdown}</h1>
                <Button white onClick={stayLoggedIn}>Stay Logged In</Button>
            </div>
        </Modal>
    )
};

export default SessionModal;