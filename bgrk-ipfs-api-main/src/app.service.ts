import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { MerkleTree } from 'merkletreejs';
import axios from 'axios';

@Injectable()
export class AppService {
  keccak256(value: string): Buffer {
    const keccakString = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(value.toString()),
    );

    return Buffer.from(keccakString.slice('0x'.length), 'hex');
  }

  getHello() {
    return { result: 'welcome to bergerak IPFS API' };
  }

  async proposalIpfs(description: string, signers: string[]) {
    const result = {
      merkleroot: null,
      ipfs: null,
    };

    if(description === "" || description === undefined || description === null){
      throw "please write something of description"
    }

    try {
      const merklegen = this.createMerkle(signers);
      const ipfsproposal = await this.dataipfs({
        description: description,
        signers: merklegen.claims,
      });

      result.merkleroot = `0x${merklegen.root.toString('hex')}`;
      result.ipfs = ipfsproposal;
    } catch (e: any) {
      throw e;
    }

    return result;
  }

  async dataipfs(input: any) {
    const result = {
      hash: null,
      url: null,
    };

    try {
      const { data } = await axios.post(`${process.env.APIURL}/upload`, input, {
        headers: {
          Authorization: `Bearer ${process.env.APIKEY}`,
          'Content-Type': '*/*',
        },
      });

      result.hash = data?.value?.cid;
      result.url = `https://${data?.value?.cid}.ipfs.nftstorage.link`;
    } catch (e: any) {
      throw e;
    }

    return result;
  }

  private createMerkle(address: string[]) {
    const claimhashes = [];
    let merkleroot;

    if(address.length < 2){
      throw "Mininum address list is 2";
    }

    try {
      const wl = this.returnChecksumAddresses(address);
      const leafNodes = wl.map((addr) => this.keccak256(addr));
      const merkleTree = new MerkleTree(leafNodes, this.keccak256, {
        sortPairs: true,
      });
      const rootHash = merkleTree.getRoot();
      merkleroot = rootHash;

      for (let a = 0; a < leafNodes.length; a++) {
        const claimHashes = merkleTree.getHexProof(leafNodes[a]);
        const data = {
          wallet: wl[a],
          claimhash: claimHashes,
        };

        claimhashes.push(data);
      }
    } catch (e: any) {
      throw e;
    }

    return {
      root: merkleroot,
      claims: claimhashes,
    };
  }

  private returnChecksumAddresses(address: string[]) {
    const checksummed = [];

    address.forEach((res) => {
      try {
        const checked = ethers.utils.getAddress(res);
        checksummed.push(checked);
      } catch {
        throw `${res} is not address`;
      }
    });

    return checksummed;
  }
}
