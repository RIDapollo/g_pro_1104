// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PartRegistry {
    struct Part {
        string partID;
        string partName;
        string manufacturer;
        string modelNumber;
        string vehicleID;
        string installationDate;
        uint256 replacementCycle; // 일 단위 예시
        string currentStatus;
        string lastInspectionDate;
    }

    mapping(string => Part) public parts;

    event PartRegistered(
        string partID,
        string partName,
        string manufacturer,
        string modelNumber,
        string vehicleID,
        string installationDate,
        uint256 replacementCycle,
        string currentStatus,
        string lastInspectionDate
    );

    function registerPart(
        string memory _partID,
        string memory _partName,
        string memory _manufacturer,
        string memory _modelNumber,
        string memory _vehicleID,
        string memory _installationDate,
        uint256 _replacementCycle,
        string memory _currentStatus,
        string memory _lastInspectionDate
    ) public {
        require(bytes(parts[_partID].partID).length == 0, "Part already registered");

        parts[_partID] = Part(
            _partID,
            _partName,
            _manufacturer,
            _modelNumber,
            _vehicleID,
            _installationDate,
            _replacementCycle,
            _currentStatus,
            _lastInspectionDate
        );

        emit PartRegistered(
            _partID,
            _partName,
            _manufacturer,
            _modelNumber,
            _vehicleID,
            _installationDate,
            _replacementCycle,
            _currentStatus,
            _lastInspectionDate
        );
    }

    function getPart(string memory _partID) public view returns (Part memory) {
        return parts[_partID];
    }
}
