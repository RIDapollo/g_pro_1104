// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PartHistory {
    struct History {
        string historyID;
        string partID;
        string vehicleID;
        string changeType;          // 예: "설치", "교체", "제거"
        string changeDate;          // 문자열 또는 timestamp 가능
        string reason;              // 설명
        string relatedRecordID;     // 연결된 정비기록 ID
    }

    mapping(string => History) public histories;

    event HistoryRecorded(
        string historyID,
        string partID,
        string vehicleID,
        string changeType,
        string changeDate,
        string reason,
        string relatedRecordID
    );

    function registerHistory(
        string memory _historyID,
        string memory _partID,
        string memory _vehicleID,
        string memory _changeType,
        string memory _changeDate,
        string memory _reason,
        string memory _relatedRecordID
    ) public {
        require(bytes(histories[_historyID].historyID).length == 0, "History already exists");

        histories[_historyID] = History(
            _historyID,
            _partID,
            _vehicleID,
            _changeType,
            _changeDate,
            _reason,
            _relatedRecordID
        );

        emit HistoryRecorded(
            _historyID,
            _partID,
            _vehicleID,
            _changeType,
            _changeDate,
            _reason,
            _relatedRecordID
        );
    }

    function getHistory(string memory _historyID) public view returns (History memory) {
        return histories[_historyID];
    }
}
