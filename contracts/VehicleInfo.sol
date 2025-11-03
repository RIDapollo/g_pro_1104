// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VehicleInfo {
    
    // --- 구조체 정의 ---

    // ✅ 정비 기록 구조체에 serialNumber 추가
    struct MaintenanceRecord {
        string description;       // 정비 내용
        uint256 timestamp;         // 정비 일시
        string serialNumber;      // ✅ 교체된 부품의 고유 일련번호
    }

    // 차량 정보 구조체
    struct Vehicle {
        address owner;
        string vehicleNumber;
        uint256 registeredAt;
        uint256 odometer;
        uint256 year;
        string manufacturer;
        MaintenanceRecord[] maintenanceHistory;
    }

    // --- 상태 변수 (매핑) ---
    
    // 차량번호(string) => Vehicle 구조체
    mapping(string => Vehicle) public vehicles;
    
    // 정비 권한 매핑: 차량번호 => 정비소 주소 => 승인 여부
    mapping(string => mapping(address => bool)) public maintenancePermissions;


    // --- 이벤트 ---
    
    event VehicleRegistered(address indexed owner, string vehicleNumber, uint256 timestamp);
    event MaintenanceAdded(string vehicleNumber, string description, uint256 timestamp);
    event OdometerUpdated(string vehicleNumber, uint256 newOdometer);
    event PermissionGranted(address indexed owner, address indexed requester, string vehicleNumber);


    // --- 함수 ---

    // 차량 등록 (소유주가 직접 호출)
    function registerVehicle(
        string memory _vehicleNumber,
        uint256 _year,
        string memory _manufacturer,
        uint256 _odometer
    ) public {
        require(bytes(_vehicleNumber).length > 0, "Vehicle number is required.");
        require(vehicles[_vehicleNumber].owner == address(0), "Vehicle is already registered.");

        vehicles[_vehicleNumber].owner = msg.sender;
        vehicles[_vehicleNumber].vehicleNumber = _vehicleNumber;
        vehicles[_vehicleNumber].registeredAt = block.timestamp;
        vehicles[_vehicleNumber].year = _year;
        vehicles[_vehicleNumber].manufacturer = _manufacturer;
        vehicles[_vehicleNumber].odometer = _odometer;

        emit VehicleRegistered(msg.sender, _vehicleNumber, block.timestamp);
    }

    // 정비 권한 부여 (소유주가 직접 호출)
    function grantPermission(
        address _owner,
        address _requester,
        string memory _vehicleNumber
    ) public {
        require(vehicles[_vehicleNumber].owner == msg.sender, "Only the vehicle owner can grant permission.");
        require(vehicles[_vehicleNumber].owner == _owner, "Owner address mismatch.");

        maintenancePermissions[_vehicleNumber][_requester] = true;
        
        emit PermissionGranted(_owner, _requester, _vehicleNumber);
    }

    // ✅ 정비 이력 추가 (소유주 또는 승인된 정비소)
    function addMaintenance(
        string memory _vehicleNumber, 
        string memory _description,
        string memory _serialNumber // ✅ 일련번호 인자 추가
    ) public {
        Vehicle storage v = vehicles[_vehicleNumber];
        require(v.owner != address(0), "Vehicle does not exist.");
        
        bool isOwner = (v.owner == msg.sender);
        bool hasPermission = maintenancePermissions[_vehicleNumber][msg.sender];
        require(isOwner || hasPermission, "Unauthorized: Requires owner or granted permission.");

        // ✅ 구조체에 일련번호 저장
        v.maintenanceHistory.push(MaintenanceRecord({
            description: _description,
            timestamp: block.timestamp,
            serialNumber: _serialNumber
        }));

        emit MaintenanceAdded(_vehicleNumber, _description, block.timestamp);
    }

    // 주행 거리 업데이트 (소유주 또는 승인된 정비소)
    function updateOdometer(string memory _vehicleNumber, uint256 _newOdometer) public {
        Vehicle storage v = vehicles[_vehicleNumber];
        
        bool isOwner = (v.owner == msg.sender);
        bool hasPermission = maintenancePermissions[_vehicleNumber][msg.sender];
        require(isOwner || hasPermission, "Unauthorized: Requires owner or granted permission.");
        
        require(_newOdometer >= v.odometer, "Odometer cannot decrease.");

        v.odometer = _newOdometer;
        emit OdometerUpdated(_vehicleNumber, _newOdometer);
    }

    // 차량 정비 이력 조회 (기존 로직 유지)
    function getMaintenanceCount(string memory _vehicleNumber) public view returns (uint256) {
        return vehicles[_vehicleNumber].maintenanceHistory.length;
    }

    function getMaintenanceRecord(string memory _vehicleNumber, uint256 index)
        public
        view
        returns (string memory description, uint256 timestamp, string memory serialNumber) // ✅ 반환값에 serialNumber 추가
    {
        MaintenanceRecord memory record = vehicles[_vehicleNumber].maintenanceHistory[index];
        return (record.description, record.timestamp, record.serialNumber);
    }
}
