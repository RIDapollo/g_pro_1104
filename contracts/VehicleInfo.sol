// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VehicleInfo {
    // 정비 기록을 위한 구조체
    struct MaintenanceRecord {
        string description;
        uint256 timestamp;
    }

    // 차량 정보를 위한 구조체
    struct Vehicle {
        address owner;
        string vehicleNumber;
        uint256 registeredAt;
        uint256 odometer;
        uint256 year;
        string manufacturer;
        MaintenanceRecord[] maintenanceHistory;
    }

    // ✅ 정비 권한 매핑: 차량번호 => 정비소 주소 => 승인 여부
    mapping(string => mapping(address => bool)) public maintenancePermissions;

    // 차량번호(string)를 키로 사용하여 Vehicle 구조체에 접근하는 매핑
    mapping(string => Vehicle) public vehicles;

    // 이벤트: 중요한 트랜잭션 기록
    event VehicleRegistered(address indexed owner, string vehicleNumber, uint256 timestamp);
    event MaintenanceAdded(string vehicleNumber, string description, uint256 timestamp);
    event OdometerUpdated(string vehicleNumber, uint256 newOdometer);
    event PermissionGranted(address indexed owner, address indexed requester, string vehicleNumber); // ✅ 새 이벤트

    // 차량 등록
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

    // ✅ 정비 권한 부여 (소유주만 호출 가능)
    function grantPermission(
        address _owner,
        address _requester,
        string memory _vehicleNumber
    ) public {
        // 함수 호출자가 차량의 실제 소유주인지 확인
        require(vehicles[_vehicleNumber].owner == msg.sender, "Only the vehicle owner can grant permission.");
        // 승인된 정비소 주소가 소유주 주소와 일치하는지 확인 (선택적 안정성 강화)
        require(vehicles[_vehicleNumber].owner == _owner, "Owner address mismatch.");

        // 정비소에 권한 부여
        maintenancePermissions[_vehicleNumber][_requester] = true;
        
        emit PermissionGranted(_owner, _requester, _vehicleNumber);
    }

    // 정비 이력 추가
    function addMaintenance(string memory _vehicleNumber, string memory _description) public {
        Vehicle storage v = vehicles[_vehicleNumber];
        require(v.owner != address(0), "Vehicle does not exist.");
        
        // ✅ 권한 확인: 소유주이거나, 정비 권한을 승인받은 정비소인지 확인
        bool isOwner = (v.owner == msg.sender);
        bool hasPermission = maintenancePermissions[_vehicleNumber][msg.sender];
        require(isOwner || hasPermission, "Unauthorized: Requires owner or granted permission.");

        v.maintenanceHistory.push(MaintenanceRecord({
            description: _description,
            timestamp: block.timestamp
        }));

        emit MaintenanceAdded(_vehicleNumber, _description, block.timestamp);
    }

    // 주행 거리 업데이트
    function updateOdometer(string memory _vehicleNumber, uint256 _newOdometer) public {
        Vehicle storage v = vehicles[_vehicleNumber];
        
        // ✅ 권한 확인: 소유주이거나, 정비 권한을 승인받은 정비소인지 확인
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
        returns (string memory description, uint256 timestamp)
    {
        MaintenanceRecord memory record = vehicles[_vehicleNumber].maintenanceHistory[index];
        return (record.description, record.timestamp);
    }
}