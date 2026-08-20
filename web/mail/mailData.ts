export interface UndetectedItem {
    last: number;
    current: number;
}

interface TestReviewItem {
    note: string;
    score: number;
    max_score: number;
    value?: string;
    time_spent: string;
    last_time_val: string;
    first_time_val: string;
    detection_hotspot_first: string;
    detection_hotspot_last: string;
    label: string;
}

interface SpeakerSegment {
    speaker: string;
    segments: number[][][];
}

interface AIResponseObject {
    score_ratios: {
        current: number;
        total: number;
    };
    test_review: {
        [key: string]: {
            detections: { [key: string]: TestReviewItem };
            total_current_score: number;
            total_max_score: number;
        };
    };
    undetected_hands: string | UndetectedItem[];
    undetected_faces: UndetectedItem[];
    speaker_segments: SpeakerSegment[];
}


export const detections: AIResponseObject = {
    "score_ratios": {
        "current": 12.333333333333334,
        "total": 175
    },
    "test_review": {
        "2188": {
            "detections": {
                "Proper Lighting": {
                    "label": "Proper Lighting",
                    "score": 0,
                    "value": "proper-lightening",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Acceptable Camera View": {
                    "label": "Acceptable Camera View",
                    "score": 0,
                    "value": "acceptable-camera-view",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Participant in Frame": {
                    "label": "Participant in Frame",
                    "score": 0,
                    "value": "participant-in-frame",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Closed Pack": {
                    "label": "Closed Pack",
                    "score": 0.13333333333333333,
                    "value": "fedex-package",
                    "max_score": 10,
                    "note": "Item partially detected",
                    "time_spent": "12300.0",
                    "last_time_val": "1727041483",
                    "first_time_val": "1727041457",
                    "detection_hotspot_first": "00:00:01:366",
                    "detection_hotspot_last": "00:00:13:666"
                }
            },
            "total_current_score": 0.13333333333333333,
            "total_max_score": 40
        },
        "2190": {
            "detections": {
                "Proper Lighting": {
                    "label": "Proper Lighting",
                    "score": 0,
                    "value": "proper-lightening",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Mouth Check": {
                    "score": 0,
                    "max_score": 0,
                    "label": "Mouth Check",
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Person In Frame": {
                    "label": "Person In Frame",
                    "score": 0,
                    "value": "mouth-open",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Acceptable Camera View": {
                    "label": "Acceptable Camera View",
                    "score": 0,
                    "value": "acceptable-camera-view",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                }
            },
            "total_current_score": 0,
            "total_max_score": 30
        },
        "2191": {
            "detections": {
                "Proper Lighting": {
                    "label": "Proper Lighting",
                    "score": 0,
                    "value": "proper-lightening",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Acceptable Camera View": {
                    "label": "Acceptable Camera View",
                    "score": 0,
                    "value": "acceptable-camera-view",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Participant in Frame": {
                    "label": "Participant in Frame",
                    "score": 0,
                    "value": "participant-in-frame",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Swab Visible": {
                    "label": "Swab Visible",
                    "score": 0,
                    "value": "saliva-swab",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                }
            },
            "total_current_score": 0,
            "total_max_score": 40
        },
        "2192": {
            "detections": {
                "Proper Lighting": {
                    "label": "Proper Lighting",
                    "score": 0,
                    "value": "proper-lightening",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Acceptable Camera View": {
                    "label": "Acceptable Camera View",
                    "score": 0,
                    "value": "acceptable-camera-view",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Participant in Frame": {
                    "label": "Participant in Frame",
                    "score": 0,
                    "value": "participant-in-frame",
                    "max_score": 10,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                },
                "Swab in Mouth": {
                    "label": "Swab in Mouth",
                    "score": 0,
                    "value": "mouth-open-with-swab",
                    "max_score": 50,
                    "note": "Item not detected",
                    "time_spent": "0",
                    "last_time_val": "0",
                    "first_time_val": "0",
                    "detection_hotspot_first": "00:00:00:000",
                    "detection_hotspot_last": "00:00:00:000"
                }
            },
            "total_current_score": 0,
            "total_max_score": 80
        }
    },
    "undetected_hands": [{
        "last": 10000,
        "current": 50000,
    },
    {
        "last": 65000,
        "current": 78000,
    },
    {
        "last": 100000,
        "current": 550000,
    }],
    "undetected_faces": [{
        "last": 10000,
        "current": 50000,
    },
    {
        "last": 65000,
        "current": 78000,
    },
    {
        "last": 100000,
        "current": 550000,
    }],
    "speaker_segments": [
        {
            "speaker": "SPEAKER_00",
            "segments": [
                [
                    [
                        8.532423208191126,
                        25.59726962457338
                    ],
                    [
                        3762.798634812287,
                        7005.119453924915
                    ]
                ]
            ]
        },
        {
            "speaker": "SPEAKER_01",
            "segments": [
                [
                    [
                        7005.119453924915,
                        10213.310580204778
                    ]
                ]
            ]
        }
    ]
};