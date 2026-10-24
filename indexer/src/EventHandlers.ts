// Envio HyperIndex event handlers for CleanSweep on Monad Testnet

export function handleBountyCreated({ event, context }: any) {
  const bountyEntity = {
    id: event.params.bountyId.toString(),
    bountyId: event.params.bountyId,
    reportId: event.params.reportId,
    creator: event.params.creator,
    token: event.params.token,
    totalPool: event.params.initialAmount,
    deadline: event.params.deadline,
    status: "Active",
    cleaner: null,
    donorCount: 1n,
    createdAtBlock: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
  };

  context.Bounty.set(bountyEntity);
}

export function handleBountyBoosted({ event, context }: any) {
  const id = event.params.bountyId.toString();
  const current = context.Bounty.get(id);

  if (current) {
    context.Bounty.set({
      ...current,
      totalPool: event.params.newTotalPool,
      donorCount: current.donorCount + 1n,
    });
  }
}

export function handleBountyClaimed({ event, context }: any) {
  const id = event.params.bountyId.toString();
  const current = context.Bounty.get(id);

  if (current) {
    context.Bounty.set({
      ...current,
      status: "Claimed",
      cleaner: event.params.cleaner,
    });
  }

  // Update cleaner aggregate profile
  const cleanerId = event.params.cleaner.toLowerCase();
  const profile = context.CleanerProfile.get(cleanerId) || {
    id: cleanerId,
    totalClaimedCount: 0n,
    totalEarnedMON: 0n,
    hasHeroSBT: false,
    sbtTokenId: null,
  };

  context.CleanerProfile.set({
    ...profile,
    totalClaimedCount: profile.totalClaimedCount + 1n,
    totalEarnedMON: profile.totalEarnedMON + event.params.netPayout,
    hasHeroSBT: profile.hasHeroSBT || event.params.sbtMinted,
  });
}

export function handleBountyRefunded({ event, context }: any) {
  const id = event.params.bountyId.toString();
  const current = context.Bounty.get(id);

  if (current) {
    context.Bounty.set({
      ...current,
      status: "Refunded",
    });
  }
}

export function handleHeroSBTClaimed({ event, context }: any) {
  const cleanerId = event.params.cleaner.toLowerCase();
  const profile = context.CleanerProfile.get(cleanerId) || {
    id: cleanerId,
    totalClaimedCount: 1n,
    totalEarnedMON: 0n,
    hasHeroSBT: true,
    sbtTokenId: event.params.tokenId,
  };

  context.CleanerProfile.set({
    ...profile,
    hasHeroSBT: true,
    sbtTokenId: event.params.tokenId,
  });
}
