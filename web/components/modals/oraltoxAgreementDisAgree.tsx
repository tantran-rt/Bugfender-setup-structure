'use client';
import { setAgreeDisagree } from '@/redux/slices/appConfig';
import './documentTypeModal.css';
import { useDispatch } from 'react-redux';

interface IModalProps {
    onClose: () => void;
    agree: () => void;
    disAgree: () => void;
}

const OraltoxResultAgreementDisagree = ({ onClose, agree, disAgree }: IModalProps) => {
   
    return (
        <div className="modal-overlay-document-type" onClick={onClose}>
            <div className="modal-content-document-type" style={{display:"flex", flexDirection:"column", gap:"10px"}} onClick={(e) => e.stopPropagation()}>
                <p>
                Please click <span style={{color:"#0C1617", fontWeight:"600", lineHeight:"20px"}}>“I agree”</span>  if the results that have been reported by the Pr App appear to be correct. 
                <br />
                <br />
                Please click <span style={{color:"#0C1617", fontWeight:"600", lineHeight:"20px"}}>“I disagree”</span> if the results reported do not appear to be correct. By clicking “I disagree” the PROFF Certification team will review your results and post the correct status. 
                </p>
                <br />
                <div style={{display:"flex", gap:"18px", height:"20px", width:"100%", alignSelf:"center"}}>
                    <p className='alco-continue-btn' onClick={agree} style={{textAlign:"center", fontWeight:"600", lineHeight:"20px", cursor:"pointer"}}>I agree</p>
                    <p className='alco-continue-btn' onClick={disAgree} style={{textAlign:"center", fontWeight:"600", lineHeight:"20px", cursor:"pointer"}}>I disagree</p>
                </div>
            </div>
        </div>
    );
};

export default OraltoxResultAgreementDisagree;
