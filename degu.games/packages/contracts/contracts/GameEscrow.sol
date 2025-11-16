// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title GameEscrow - Advanced Gaming Platform Contract
 * @dev Production-ready escrow system with comprehensive security measures
 */
contract GameEscrow is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    enum GameMode { WinnerTakesAll, TeamBattle, FreeForAll, ScoreBased }
    enum GameStatus { Waiting, Active, Finished, Cancelled, Emergency }

    struct GameLimits {
        uint256 minEntryFee;
        uint256 maxEntryFee;
        uint256 minPlayers;
        uint256 maxPlayers;
        uint256 maxTimeLimit;
        uint256 maxCreatorCommission;
        uint256 maxPlatformCommission;
    }

    struct Game {
        uint256 gameId;
        address creator;
        IERC20 paymentToken;
        GameMode mode;
        uint256 entryFee;
        uint256 maxPlayers;
        uint256 numTeams;
        uint256 timeLimit;
        uint256 startTime;
        uint256 createdAt;
        GameStatus status;
        address[] players;
        mapping(address => uint256) playerTeams;
        mapping(address => bool) hasJoined;
        uint256 prizePool;
        uint256 creatorCommission;
        uint256 platformCommission;
        bool payoutComplete;
        bytes32 gameHash; // For integrity verification
    }

    // Core state
    GameLimits public gameLimits;
    uint256 public gameIdCounter;
    mapping(uint256 => Game) public games;

    // Balances per token
    mapping(address => mapping(IERC20 => uint256)) public creatorEarnings;
    mapping(address => mapping(IERC20 => uint256)) public playerBalances;
    mapping(IERC20 => uint256) public platformRevenue;

    // Token management
    mapping(IERC20 => bool) public allowedTokens;
    IERC20[] public supportedTokens;

    // Game discovery
    mapping(address => uint256[]) public creatorGames;
    mapping(GameMode => uint256[]) public gamesByMode;
    uint256[] public activeGames;
    uint256[] public waitingGames;

    // Anti-griefing
    mapping(address => uint256) public playerReputationScore;
    mapping(address => uint256) public lastGameJoinTime;
    mapping(address => uint256) public gamesPlayedToday;
    mapping(address => uint256) public lastDayReset;
    uint256 public constant JOIN_COOLDOWN = 5 seconds;
    uint256 public constant MAX_GAMES_PER_DAY = 100;

    // Circuit breakers
    uint256 public totalValueLocked;
    uint256 public maxTVLLimit;
    mapping(IERC20 => uint256) public tokenTVL;
    mapping(IERC20 => uint256) public maxTokenLimit;

    // Events
    event GameCreated(
        uint256 indexed gameId,
        address indexed creator,
        IERC20 indexed token,
        GameMode mode,
        uint256 entryFee,
        uint256 maxPlayers,
        uint256 creatorCommission
    );

    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 team);
    event GameStarted(uint256 indexed gameId, uint256 startTime);
    event GameFinished(uint256 indexed gameId, address[] winners, uint256 totalPayout);
    event PayoutDistributed(uint256 indexed gameId, address indexed player, uint256 amount);
    event CreatorPaid(uint256 indexed gameId, address indexed creator, uint256 amount);
    event GameCancelled(uint256 indexed gameId, string reason);
    event EmergencyAction(uint256 indexed gameId, string action, address actor);
    event TokenAdded(IERC20 indexed token);
    event TokenRemoved(IERC20 indexed token);
    event LimitsUpdated(GameLimits newLimits);

    // Custom errors
    error GameNotFound();
    error GameNotWaiting();
    error GameNotActive();
    error PlayerAlreadyJoined();
    error GameFull();
    error InvalidTeam();
    error NotGameCreator();
    error PayoutAlreadyComplete();
    error InsufficientBalance();
    error TokenNotAllowed();
    error ExceedsLimit();
    error CooldownActive();
    error InvalidCommission();
    error InvalidGameParameters();
    error EmergencyModeActive();

    modifier gameExists(uint256 gameId) {
        if (gameId >= gameIdCounter) revert GameNotFound();
        _;
    }

    modifier onlyGameCreator(uint256 gameId) {
        if (games[gameId].creator != msg.sender) revert NotGameCreator();
        _;
    }

    modifier rateLimited() {
        if (block.timestamp < lastGameJoinTime[msg.sender] + JOIN_COOLDOWN) {
            revert CooldownActive();
        }

        // Reset daily counter if needed
        if (block.timestamp >= lastDayReset[msg.sender] + 1 days) {
            gamesPlayedToday[msg.sender] = 0;
            lastDayReset[msg.sender] = block.timestamp;
        }

        if (gamesPlayedToday[msg.sender] >= MAX_GAMES_PER_DAY) {
            revert ExceedsLimit();
        }

        _;

        lastGameJoinTime[msg.sender] = block.timestamp;
        gamesPlayedToday[msg.sender]++;
    }

    modifier withinTVLLimits(IERC20 token, uint256 amount) {
        if (totalValueLocked + amount > maxTVLLimit) revert ExceedsLimit();
        if (tokenTVL[token] + amount > maxTokenLimit[token]) revert ExceedsLimit();
        _;
    }

    constructor(
        address admin,
        address oracle,
        uint256 _maxTVLLimit
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, oracle);
        _grantRole(EMERGENCY_ROLE, admin);

        // Set conservative defaults
        gameLimits = GameLimits({
            minEntryFee: 1e6,        // 1 USDC
            maxEntryFee: 10000e6,    // 10,000 USDC
            minPlayers: 2,
            maxPlayers: 16,
            maxTimeLimit: 1 hours,
            maxCreatorCommission: 5000,  // 50%
            maxPlatformCommission: 2000  // 20%
        });

        maxTVLLimit = _maxTVLLimit;
    }

    function addAllowedToken(
        IERC20 token,
        uint256 _maxTokenLimit
    ) external onlyRole(ADMIN_ROLE) {
        if (allowedTokens[token]) return; // Already added

        allowedTokens[token] = true;
        maxTokenLimit[token] = _maxTokenLimit;
        supportedTokens.push(token);

        emit TokenAdded(token);
    }

    function removeAllowedToken(IERC20 token) external onlyRole(ADMIN_ROLE) {
        allowedTokens[token] = false;

        // Remove from supported tokens array
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }

        emit TokenRemoved(token);
    }

    function createGame(
        IERC20 _paymentToken,
        GameMode _mode,
        uint256 _entryFee,
        uint256 _maxPlayers,
        uint256 _numTeams,
        uint256 _timeLimit,
        uint256 _creatorCommission,
        uint256 _platformCommission
    ) external whenNotPaused nonReentrant returns (uint256 gameId) {
        // Validation
        if (!allowedTokens[_paymentToken]) revert TokenNotAllowed();
        if (_entryFee < gameLimits.minEntryFee || _entryFee > gameLimits.maxEntryFee)
            revert InvalidGameParameters();
        if (_maxPlayers < gameLimits.minPlayers || _maxPlayers > gameLimits.maxPlayers)
            revert InvalidGameParameters();
        if (_timeLimit > gameLimits.maxTimeLimit) revert InvalidGameParameters();
        if (_creatorCommission > gameLimits.maxCreatorCommission) revert InvalidCommission();
        if (_platformCommission > gameLimits.maxPlatformCommission) revert InvalidCommission();
        if (_creatorCommission + _platformCommission >= 10000) revert InvalidCommission();

        if (_mode == GameMode.TeamBattle) {
            if (_numTeams < 2 || _numTeams > 4) revert InvalidGameParameters();
            if (_maxPlayers % _numTeams != 0) revert InvalidGameParameters();
        }

        gameId = gameIdCounter++;
        Game storage game = games[gameId];

        game.gameId = gameId;
        game.creator = msg.sender;
        game.paymentToken = _paymentToken;
        game.mode = _mode;
        game.entryFee = _entryFee;
        game.maxPlayers = _maxPlayers;
        game.numTeams = _numTeams;
        game.timeLimit = _timeLimit;
        game.creatorCommission = _creatorCommission;
        game.platformCommission = _platformCommission;
        game.status = GameStatus.Waiting;
        game.createdAt = block.timestamp;

        // Generate integrity hash
        game.gameHash = keccak256(abi.encodePacked(
            gameId, msg.sender, address(_paymentToken), _mode, _entryFee, block.timestamp
        ));

        // Add to discovery arrays
        creatorGames[msg.sender].push(gameId);
        gamesByMode[_mode].push(gameId);
        waitingGames.push(gameId);

        emit GameCreated(gameId, msg.sender, _paymentToken, _mode, _entryFee, _maxPlayers, _creatorCommission);
    }

    function joinGame(
        uint256 gameId,
        uint256 teamId
    ) external gameExists(gameId) whenNotPaused nonReentrant rateLimited {
        Game storage game = games[gameId];

        if (game.status != GameStatus.Waiting) revert GameNotWaiting();
        if (game.hasJoined[msg.sender]) revert PlayerAlreadyJoined();
        if (game.players.length >= game.maxPlayers) revert GameFull();

        if (game.mode == GameMode.TeamBattle) {
            if (teamId >= game.numTeams) revert InvalidTeam();
        }

        // Check TVL limits
        uint256 entryAmount = game.entryFee;
        if (totalValueLocked + entryAmount > maxTVLLimit) revert ExceedsLimit();
        if (tokenTVL[game.paymentToken] + entryAmount > maxTokenLimit[game.paymentToken])
            revert ExceedsLimit();

        // Transfer entry fee
        game.paymentToken.safeTransferFrom(msg.sender, address(this), entryAmount);

        // Update tracking
        totalValueLocked += entryAmount;
        tokenTVL[game.paymentToken] += entryAmount;

        // Add player to game
        game.players.push(msg.sender);
        game.hasJoined[msg.sender] = true;
        if (game.mode == GameMode.TeamBattle) {
            game.playerTeams[msg.sender] = teamId;
        }

        game.prizePool += entryAmount;

        // Update reputation
        playerReputationScore[msg.sender]++;

        emit PlayerJoined(gameId, msg.sender, teamId);

        // Auto-start if full
        if (game.players.length == game.maxPlayers) {
            _startGame(gameId);
        }
    }

    function _startGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.status = GameStatus.Active;
        game.startTime = block.timestamp;

        // Move from waiting to active
        _removeFromWaitingGames(gameId);
        activeGames.push(gameId);

        emit GameStarted(gameId, game.startTime);
    }

    function reportGameResult(
        uint256 gameId,
        address[] calldata winners
    ) external onlyRole(ORACLE_ROLE) gameExists(gameId) nonReentrant {
        Game storage game = games[gameId];

        if (game.status != GameStatus.Active) revert GameNotActive();
        if (game.payoutComplete) revert PayoutAlreadyComplete();
        if (winners.length == 0) revert InvalidGameParameters();

        // Validate winners are actual players
        for (uint256 i = 0; i < winners.length; i++) {
            if (!game.hasJoined[winners[i]]) revert InvalidGameParameters();
        }

        game.status = GameStatus.Finished;
        uint256 totalPayout = _distributePayout(gameId, winners);

        // Remove from active games
        _removeFromActiveGames(gameId);

        emit GameFinished(gameId, winners, totalPayout);
    }

    function _distributePayout(uint256 gameId, address[] calldata winners) internal returns (uint256 totalPayout) {
        Game storage game = games[gameId];
        uint256 totalPrize = game.prizePool;
        IERC20 token = game.paymentToken;

        // Calculate amounts
        uint256 creatorAmount = (totalPrize * game.creatorCommission) / 10000;
        uint256 platformAmount = (totalPrize * game.platformCommission) / 10000;
        uint256 winnerAmount = totalPrize - creatorAmount - platformAmount;

        // Update TVL tracking
        totalValueLocked -= totalPrize;
        tokenTVL[token] -= totalPrize;

        // Distribute payments
        if (creatorAmount > 0) {
            creatorEarnings[game.creator][token] += creatorAmount;
            emit CreatorPaid(gameId, game.creator, creatorAmount);
        }

        if (platformAmount > 0) {
            platformRevenue[token] += platformAmount;
        }

        // Pay winners
        uint256 amountPerWinner = winnerAmount / winners.length;
        for (uint256 i = 0; i < winners.length; i++) {
            playerBalances[winners[i]][token] += amountPerWinner;
            playerReputationScore[winners[i]] += 2; // Bonus for winning
            emit PayoutDistributed(gameId, winners[i], amountPerWinner);
        }

        game.payoutComplete = true;
        return winnerAmount;
    }

    function reportGameTimeout(uint256 gameId) external onlyRole(ORACLE_ROLE) gameExists(gameId) {
        Game storage game = games[gameId];

        if (game.status != GameStatus.Active) revert GameNotActive();
        if (block.timestamp < game.startTime + game.timeLimit) revert InvalidGameParameters();

        _refundGame(gameId, "Timeout");
    }

    function cancelGame(uint256 gameId, string calldata reason) external gameExists(gameId) {
        Game storage game = games[gameId];

        bool canCancel = msg.sender == game.creator ||
                        hasRole(ADMIN_ROLE, msg.sender) ||
                        (game.status == GameStatus.Waiting && block.timestamp > game.createdAt + 1 hours);

        if (!canCancel) revert NotGameCreator();
        if (game.status != GameStatus.Waiting) revert GameNotWaiting();

        _refundGame(gameId, reason);
    }

    function emergencyRefund(uint256 gameId) external onlyRole(EMERGENCY_ROLE) gameExists(gameId) {
        _refundGame(gameId, "Emergency");
        emit EmergencyAction(gameId, "Refund", msg.sender);
    }

    function _refundGame(uint256 gameId, string memory reason) internal nonReentrant {
        Game storage game = games[gameId];
        game.status = GameStatus.Cancelled;

        IERC20 token = game.paymentToken;
        uint256 refundAmount = game.entryFee;

        // Update TVL tracking
        uint256 totalRefund = refundAmount * game.players.length;
        totalValueLocked -= totalRefund;
        tokenTVL[token] -= totalRefund;

        // Refund all players
        for (uint256 i = 0; i < game.players.length; i++) {
            playerBalances[game.players[i]][token] += refundAmount;
        }

        // Clean up arrays
        if (game.status == GameStatus.Waiting) {
            _removeFromWaitingGames(gameId);
        } else {
            _removeFromActiveGames(gameId);
        }

        emit GameCancelled(gameId, reason);
    }

    // Withdrawal functions with proper checks
    function withdrawCreatorEarnings(IERC20 token) external nonReentrant {
        uint256 amount = creatorEarnings[msg.sender][token];
        if (amount == 0) revert InsufficientBalance();

        creatorEarnings[msg.sender][token] = 0;
        token.safeTransfer(msg.sender, amount);
    }

    function withdrawPlayerBalance(IERC20 token) external nonReentrant {
        uint256 amount = playerBalances[msg.sender][token];
        if (amount == 0) revert InsufficientBalance();

        playerBalances[msg.sender][token] = 0;
        token.safeTransfer(msg.sender, amount);
    }

    function withdrawAllBalances() external nonReentrant {
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            IERC20 token = supportedTokens[i];
            uint256 amount = playerBalances[msg.sender][token];
            if (amount > 0) {
                playerBalances[msg.sender][token] = 0;
                token.safeTransfer(msg.sender, amount);
            }
        }
    }

    function withdrawPlatformRevenue(IERC20 token) external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 amount = platformRevenue[token];
        if (amount == 0) revert InsufficientBalance();

        platformRevenue[token] = 0;
        token.safeTransfer(msg.sender, amount);
    }

    // Emergency functions
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyTokenRecovery(
        IERC20 token,
        address to,
        uint256 amount
    ) external onlyRole(EMERGENCY_ROLE) {
        token.safeTransfer(to, amount);
        emit EmergencyAction(0, "Token Recovery", msg.sender);
    }

    // Utility functions
    function _removeFromWaitingGames(uint256 gameId) internal {
        for (uint256 i = 0; i < waitingGames.length; i++) {
            if (waitingGames[i] == gameId) {
                waitingGames[i] = waitingGames[waitingGames.length - 1];
                waitingGames.pop();
                break;
            }
        }
    }

    function _removeFromActiveGames(uint256 gameId) internal {
        for (uint256 i = 0; i < activeGames.length; i++) {
            if (activeGames[i] == gameId) {
                activeGames[i] = activeGames[activeGames.length - 1];
                activeGames.pop();
                break;
            }
        }
    }

    // View functions
    function getGame(uint256 gameId) external view gameExists(gameId) returns (
        address creator,
        address token,
        GameMode mode,
        uint256 entryFee,
        uint256 maxPlayers,
        uint256 numTeams,
        GameStatus status,
        address[] memory players,
        uint256 prizePool,
        uint256 creatorCommission,
        uint256 platformCommission,
        uint256 startTime,
        bytes32 gameHash
    ) {
        Game storage game = games[gameId];
        return (
            game.creator,
            address(game.paymentToken),
            game.mode,
            game.entryFee,
            game.maxPlayers,
            game.numTeams,
            game.status,
            game.players,
            game.prizePool,
            game.creatorCommission,
            game.platformCommission,
            game.startTime,
            game.gameHash
        );
    }

    function getWaitingGames() external view returns (uint256[] memory) {
        return waitingGames;
    }

    function getActiveGames() external view returns (uint256[] memory) {
        return activeGames;
    }

    function getSupportedTokens() external view returns (IERC20[] memory) {
        return supportedTokens;
    }

    function getCreatorGames(address creator) external view returns (uint256[] memory) {
        return creatorGames[creator];
    }

    function getPlayerBalances(address player) external view returns (IERC20[] memory tokens, uint256[] memory amounts) {
        tokens = new IERC20[](supportedTokens.length);
        amounts = new uint256[](supportedTokens.length);

        for (uint256 i = 0; i < supportedTokens.length; i++) {
            tokens[i] = supportedTokens[i];
            amounts[i] = playerBalances[player][supportedTokens[i]];
        }
    }

    // Admin functions
    function updateGameLimits(GameLimits calldata newLimits) external onlyRole(ADMIN_ROLE) {
        gameLimits = newLimits;
        emit LimitsUpdated(newLimits);
    }

    function updateTVLLimits(uint256 newMaxTVL) external onlyRole(ADMIN_ROLE) {
        maxTVLLimit = newMaxTVL;
    }

    function updateTokenLimit(IERC20 token, uint256 newLimit) external onlyRole(ADMIN_ROLE) {
        maxTokenLimit[token] = newLimit;
    }
}
