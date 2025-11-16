# Betting Game Examples for Scratch Blockchain

This document provides example Scratch block sequences for creating blockchain-based betting games using the DEGU token and SimpleBetting contract.

## Prerequisites

Before you can use these examples:

1. ✅ Contracts deployed to Sepolia testnet (see `packages/contracts/DEPLOYMENT_GUIDE.md`)
2. ✅ Contract addresses updated in `auth-manager.js`
3. ✅ Logged in with Web3Auth
4. ✅ Have DEGU tokens in your wallet

## Example 1: Simple Coin Flip Game

This creates a 2-player coin flip game where winner takes all.

### Scratch Blocks (Creator Side)

```scratch
When green flag clicked
  say (join "Creator: " (my wallet address)) for 2 seconds
  say (join "Balance: " (balance of DEGU for (my wallet address))) for 2 seconds

  // Create the game
  say "Creating coin flip game..." for 2 seconds
  create betting game with 100 DEGU bet, 2 to 2 players
  wait 3 seconds

  say "Game created! Waiting for player to join..." for 5 seconds

  // Check if we have 2 players
  wait until <game 0 current players> = [2]

  say "Starting game..." for 2 seconds
  start betting game 0
  wait 3 seconds

  say "Flipping coin..." for 2 seconds
  set [winner] to (random number from 1 to 2)

  if <winner = [1]> then
    say "Player 1 wins!" for 2 seconds
    select (item 1 of (game 0 players)) as winner of game 0
  else
    say "Player 2 wins!" for 2 seconds
    select (item 2 of (game 0 players)) as winner of game 0
  end

  wait 3 seconds
  say "Winner can now claim their prize!" for 3 seconds
```

### Scratch Blocks (Player Side)

```scratch
When green flag clicked
  say (join "Player: " (my wallet address)) for 2 seconds

  ask [Enter game ID to join:] and wait
  set [gameId] to (answer)

  say (join "Joining game " (gameId)) for 2 seconds
  join betting game (gameId)

  wait 5 seconds
  say "Waiting for game to complete..." for 3 seconds

  // Wait for winners to be selected
  wait until <(game (gameId) status) = [Completed]>

  say "Game completed! Claiming prize..." for 2 seconds
  claim prize from game (gameId)

  wait 3 seconds
  say (join "New balance: " (balance of DEGU for (my wallet address))) for 3 seconds
```

## Example 2: Multi-Player Lottery

A lottery where one random player wins the entire pot.

### Scratch Blocks

```scratch
When green flag clicked
  say "🎰 DEGU Lottery Starting! 🎰" for 2 seconds

  // Create lottery game
  create betting game with 50 DEGU bet, 2 to 10 players
  wait 3 seconds

  say "Lottery created! Players can join now." for 3 seconds
  say "Game will auto-start when we have at least 2 players" for 3 seconds

  // Wait for minimum players
  wait until <(game 0 current players) >= [2]>

  say "We have enough players! Starting in 10 seconds..." for 5 seconds
  wait 5 seconds
  say "5 seconds..." for 5 seconds

  // Start the game
  start betting game 0
  wait 3 seconds

  // Get number of players
  set [playerCount] to (game 0 current players)

  say (join "Drawing winner from " (join (playerCount) " players...")) for 3 seconds

  // Randomly select winner
  set [winnerIndex] to (random number from 1 to (playerCount))
  set [winnerAddress] to (item (winnerIndex) of (game 0 players))

  say "🎲 Rolling the dice... 🎲" for 2 seconds

  // Dramatic pause
  repeat 3
    say "..." for 1 seconds
  end

  say (join "🎉 Winner: " (winnerAddress)) for 5 seconds

  // Select winner
  select (winnerAddress) as winner of game 0

  wait 3 seconds
  say "Winner can claim their prize!" for 3 seconds

  // Show pot amount
  set [pot] to (game 0 total pot)
  say (join "Prize: " (join (pot) " DEGU")) for 5 seconds
```

## Example 3: Team Battle Game

Two teams compete, winning team splits the pot.

### Scratch Blocks

```scratch
When green flag clicked
  say "⚔️ Team Battle Starting! ⚔️" for 2 seconds

  // Create 4-player game
  create betting game with 100 DEGU bet, 4 to 4 players
  wait 3 seconds

  say "Waiting for 4 players..." for 3 seconds

  // Wait for all players
  wait until <(game 0 current players) = [4]>

  say "All players joined! Teams:" for 2 seconds
  say (join "Team A: " (item 1 of (game 0 players))) for 3 seconds
  say (join "Team A: " (item 2 of (game 0 players))) for 3 seconds
  say (join "Team B: " (item 3 of (game 0 players))) for 3 seconds
  say (join "Team B: " (item 4 of (game 0 players))) for 3 seconds

  // Start game
  start betting game 0
  wait 3 seconds

  say "Battle begins! Best of 3 rounds..." for 3 seconds

  // Simulate 3 rounds
  set [teamAWins] to [0]
  set [teamBWins] to [0]

  repeat 3
    set [round] to ((round) + 1)
    say (join "Round " (round)) for 2 seconds

    set [roundWinner] to (random number from 1 to 2)

    if <roundWinner = [1]> then
      say "Team A wins this round!" for 2 seconds
      change [teamAWins] by 1
    else
      say "Team B wins this round!" for 2 seconds
      change [teamBWins] by 1
    end

    wait 2 seconds
  end

  // Determine winner
  if <teamAWins > teamBWins> then
    say "🏆 Team A WINS! 🏆" for 3 seconds

    // Create winner array (players 1 and 2)
    set [winner1] to (item 1 of (game 0 players))
    set [winner2] to (item 2 of (game 0 players))
    set [winners] to (join (winner1) (join "," (winner2)))

    select (winners) as winner of game 0
  else
    say "🏆 Team B WINS! 🏆" for 3 seconds

    // Create winner array (players 3 and 4)
    set [winner1] to (item 3 of (game 0 players))
    set [winner2] to (item 4 of (game 0 players))
    set [winners] to (join (winner1) (join "," (winner2)))

    select (winners) as winner of game 0
  end

  wait 3 seconds
  say "Winners can claim their prizes!" for 3 seconds
  say "Each winner gets half the pot" for 3 seconds
```

## Example 4: Checking Balance Before Playing

Always check if players have enough tokens before joining.

### Scratch Blocks

```scratch
When green flag clicked
  set [betAmount] to [100]
  set [myWallet] to (my wallet address)

  say "Checking your DEGU balance..." for 2 seconds

  if <wallet (myWallet) has (betAmount) DEGU?> then
    say "✅ You have enough DEGU!" for 2 seconds

    ask [Enter game ID to join:] and wait
    set [gameId] to (answer)

    join betting game (gameId)
    say "Joined game successfully!" for 2 seconds
  else
    say "❌ Not enough DEGU tokens" for 3 seconds
    say (join "You need " (betAmount)) for 2 seconds
    say (join "You have " (balance of DEGU for (myWallet))) for 2 seconds
  end
```

## Example 5: Game Status Monitor

Monitor a game's status in real-time.

### Scratch Blocks

```scratch
When green flag clicked
  ask [Enter game ID to monitor:] and wait
  set [gameId] to (answer)

  forever
    set [status] to (game (gameId) status)
    set [players] to (game (gameId) current players)
    set [maxPlayers] to (game (gameId) max players)
    set [pot] to (game (gameId) total pot)

    say (join "Status: " (status)) for 2 seconds
    say (join "Players: " (join (players) (join "/" (maxPlayers)))) for 2 seconds
    say (join "Pot: " (join (pot) " DEGU")) for 2 seconds

    wait 5 seconds
  end
```

## Example 6: Auto-Claim for Winners

Automatically claim prize when you win.

### Scratch Blocks

```scratch
When green flag clicked
  set [myWallet] to (my wallet address)

  ask [Enter game ID:] and wait
  set [gameId] to (answer)

  say "Monitoring game for completion..." for 2 seconds

  // Wait for game to complete
  wait until <(game (gameId) status) = [Completed]>

  say "Game completed! Checking if I won..." for 2 seconds

  // Get winners list
  set [winners] to (game (gameId) winners)

  // Check if my address is in winners
  if <(winners) contains (myWallet)?> then
    say "🎉 I WON! Claiming prize..." for 3 seconds

    claim prize from game (gameId)

    wait 3 seconds
    say "✅ Prize claimed successfully!" for 3 seconds

    set [newBalance] to (balance of DEGU for (myWallet))
    say (join "New balance: " (join (newBalance) " DEGU")) for 3 seconds
  else
    say "😢 I didn't win this time" for 3 seconds
  end
```

## Example 7: Transfer DEGU to Friend

Simple token transfer example.

### Scratch Blocks

```scratch
When green flag clicked
  ask [Recipient address (0x...):] and wait
  set [recipient] to (answer)

  ask [Amount of DEGU to send:] and wait
  set [amount] to (answer)

  say (join "Sending " (join (amount) " DEGU...")) for 2 seconds

  transfer (amount) DEGU to (recipient)

  wait 3 seconds
  say "✅ Transfer complete!" for 3 seconds
```

## Tips for Building Betting Games

### 1. Always Check Balances
```scratch
if <wallet (player) has (betAmount) TOKEN?> then
  // Allow player to join
else
  // Show error message
end
```

### 2. Wait for Transactions
All blockchain operations are async and pause the game automatically. Add visual feedback:
```scratch
say "⏳ Processing transaction..." for 2 seconds
transfer 100 DEGU to (address)
say "✅ Transaction confirmed!" for 2 seconds
```

### 3. Handle Game States
```scratch
if <(game 0 status) = [Open]> then
  // Players can still join
else if <(game 0 status) = [In Progress]> then
  // Game is running
else if <(game 0 status) = [Completed]> then
  // Winners can claim prizes
end
```

### 4. Provide Clear Feedback
```scratch
say "🎮 Creating game..." for 2 seconds
create betting game with 100 DEGU bet, 2 to 4 players
wait 3 seconds
say "✅ Game created!" for 2 seconds
say (join "Game ID: " (game 0 gameId)) for 3 seconds
```

### 5. Test with Small Amounts
Start with small bet amounts during testing:
```scratch
create betting game with 1 DEGU bet, 2 to 2 players
```

## Common Patterns

### Multi-Winner Selection
```scratch
// For 2 winners
set [winner1] to (item 1 of (game 0 players))
set [winner2] to (item 2 of (game 0 players))
set [winners] to (join (winner1) (join "," (winner2)))
select (winners) as winner of game 0
```

### Timeout Protection
```scratch
set [timeout] to [60]
repeat until <(game 0 current players) >= [2]>
  wait 1 seconds
  change [timeout] by -1

  if <timeout = [0]> then
    say "Game timeout - not enough players" for 3 seconds
    cancel betting game 0
    stop [all]
  end
end
```

### Fair Random Selection
```scratch
// Use block timestamp for randomness
set [seed] to (timer)
set [random] to ((seed) mod (game 0 current players))
set [winnerIndex] to ((random) + 1)
```

## Debugging Tips

1. **Enable Console Logging**: Open browser console (F12) to see detailed logs
2. **Check Etherscan**: Monitor transactions at `https://sepolia.etherscan.io/`
3. **Verify Wallet**: Always confirm wallet address is correct
4. **Test Flow**: Test complete flow with 2 accounts before launching
5. **Error Messages**: Read error messages carefully - they explain what went wrong

## Security Reminders

- ⚠️ Only the game creator can select winners
- ⚠️ Only winners can claim prizes
- ⚠️ Games cannot be modified after starting
- ⚠️ Always verify game details before joining
- ⚠️ Keep private keys secure - never share them

## Next Steps

1. Deploy contracts (see `packages/contracts/DEPLOYMENT_GUIDE.md`)
2. Update contract addresses
3. Mint test DEGU tokens
4. Try these examples in Scratch GUI
5. Build your own unique betting games!

## Need Help?

- Check browser console for errors
- Verify contract addresses are correct
- Ensure Web3Auth login is complete
- Check DEGU balance is sufficient
- See `packages/contracts/CONFIGURATION.md` for technical details
