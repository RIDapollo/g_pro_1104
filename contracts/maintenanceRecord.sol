// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MaintenanceRecord {
    struct Record {
        string recordID;
        string vehicleID;
        string partID;
        string inspectionDate;
        string description;
        string mechanicID;
        uint256 cost; // wei 단위
        string nextInspectionDate;
    }

    mapping(string => Record) public records;

    event RecordRegistered(
        string recordID,
        string vehicleID,
        string partID,
        string inspectionDate,
        string description,
        string mechanicID,
        uint256 cost,
        string nextInspectionDate
    );

    function registerRecord(
        string memory _recordID,
        string memory _vehicleID,
        string memory _partID,
        string memory _inspectionDate,
        string memory _description,
        string memory _mechanicID,
        uint256 _cost,
        string memory _nextInspectionDate
    ) public {
        require(bytes(records[_recordID].recordID).length == 0, "Record already exists");

        records[_recordID] = Record(
            _recordID,
            _vehicleID,
            _partID,
            _inspectionDate,
            _description,
            _mechanicID,
            _cost,
            _nextInspectionDate
        );

        emit RecordRegistered(
            _recordID,
            _vehicleID,
            _partID,
            _inspectionDate,
            _description,
            _mechanicID,
            _cost,
            _nextInspectionDate
        );
    }

    function getRecord(string memory _recordID) public view returns (Record memory) {
        return records[_recordID];
    }
}
