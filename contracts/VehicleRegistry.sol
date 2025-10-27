// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// VehicleRegistry.sol 컨트랙트와 상속 관계를 제거했습니다.
// 단일 파일로 동작하도록 수정.

contract VehicleInfo {
    // 정비 기록을 위한 구조체
    struct MaintenanceRecord {
        string description;  // 정비 내용
        uint256 timestamp;    // 정비 일시
    }

    // 차량 정보를 위한 구조체
    struct Vehicle {
        address owner;        // 소유자 (메타마스크 주소)
        string vehicleNumber;  // 차량 번호
        uint256 registeredAt;   // 등록 일자
        uint256 odometer;      // 주행 거리
        MaintenanceRecord[] maintenanceHistory; // 정비 이력 목록
    }

    // 차량 번호(string)를 키로 사용하여 Vehicle 구조체에 접근하는 매핑
    mapping(string => Vehicle) public vehicles;
    
    // 차량 번호에 대한 소유자 매핑
    mapping(string => address) private vehicleOwners;

    // 이벤트: 중요한 트랜잭션 기록
    event VehicleRegistered(address indexed owner, string vehicleNumber, uint256 timestamp);
    event MaintenanceAdded(string vehicleNumber, string description, uint256 timestamp);
    event OdometerUpdated(string vehicleNumber, uint256 newOdometer);

    // 차량 등록
    function registerVehicle(string memory _vehicleNumber, uint256 _odometer) public {
        // 오류 메시지를 영문으로 수정
        require(bytes(_vehicleNumber).length > 0, "Vehicle number is required.");
        require(vehicleOwners[_vehicleNumber] == address(0), "Vehicle is already registered.");

        vehicles[_vehicleNumber].owner = msg.sender;
        vehicles[_vehicleNumber].vehicleNumber = _vehicleNumber;
        vehicles[_vehicleNumber].registeredAt = block.timestamp;
        vehicles[_vehicleNumber].odometer = _odometer;
        
        vehicleOwners[_vehicleNumber] = msg.sender;

        emit VehicleRegistered(msg.sender, _vehicleNumber, block.timestamp);
    }

    // 정비 이력 추가
    function addMaintenance(string memory _vehicleNumber, string memory _description) public {
        Vehicle storage v = vehicles[_vehicleNumber];
        // 오류 메시지를 영문으로 수정
        require(v.owner != address(0), "Vehicle does not exist.");
        require(v.owner == msg.sender, "Only the vehicle owner can add maintenance records.");

        v.maintenanceHistory.push(MaintenanceRecord({
            description: _description,
            timestamp: block.timestamp
        }));

        emit MaintenanceAdded(_vehicleNumber, _description, block.timestamp);
    }

    // 주행 거리 업데이트
    function updateOdometer(string memory _vehicleNumber, uint256 _newOdometer) public {
        Vehicle storage v = vehicles[_vehicleNumber];
        // 오류 메시지를 영문으로 수정
        require(v.owner == msg.sender, "Only the vehicle owner can update the odometer.");
        require(_newOdometer >= v.odometer, "Odometer cannot decrease.");

        v.odometer = _newOdometer;
        emit OdometerUpdated(_vehicleNumber, _newOdometer);
    }

    // 차량 정비 이력 조회
    function getMaintenanceCount(string memory _vehicleNumber) public view returns (uint256) {
        return vehicles[_vehicleNumber].maintenanceHistory.length;
    }

    function getMaintenanceRecord(string memory _vehicleNumber, uint256 index)
        public
        view
        returns (string memory description, uint256 timestamp)
    {
        MaintenanceRecord memory record = vehicles[_vehicleNumber].maintenanceHistory[index];
        return (record.description, record.timestamp);
    }
}