<?php

namespace App\Http\Services\Products;

use App\Http\Repositories\Contracts\Products\ProductRepositoryInterface;
use App\Http\Services\BaseService;

class ProductService extends BaseService
{

    public function __construct(ProductRepositoryInterface $repo)
    {
        parent::__construct($repo);
    }

    public function getProducts()
    {
        return $this->repo->all();
    }
    public function findProduct($id)
    {
        return $this->repo->find($id);
    }

    public function createProduct(array $data, ?UploadedFile $image = null)
    {
        if ($image) {
            $path = $image->store('products', 'public');
            $data['url_image'] = $path;
        }

        return $this->repo->create($data);
    }

    public function deleteProduct($id)
    {
        return $this->repo->delete($id);
    }

    public function deleteProducts($ids)
    {
        return $this->repo->deleteMany($ids);
    }
}
